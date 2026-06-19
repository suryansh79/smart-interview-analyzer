package com.interview.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interview.backend.entity.AnalysisJob;
import com.interview.backend.entity.AnalysisResult;
import com.interview.backend.repository.AnalysisJobRepository;
import com.interview.backend.repository.AnalysisResultRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.File;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class TranscriptionService {

    private static final Logger log = LoggerFactory.getLogger(TranscriptionService.class);

    private final RestTemplate restTemplate;
    private final S3Client s3Client;
    private final AnalysisJobRepository jobRepository;
    private final AnalysisResultRepository resultRepository;
    private final ObjectMapper objectMapper;

    @Value("${aws.bucketName}")
    private String bucketName;

    @Value("${flask.service.url}")
    private String flaskServiceUrl;

    public TranscriptionService(RestTemplate restTemplate, S3Client s3Client,
                                 AnalysisJobRepository jobRepository,
                                 AnalysisResultRepository resultRepository,
                                 ObjectMapper objectMapper) {
        this.restTemplate = restTemplate;
        this.s3Client = s3Client;
        this.jobRepository = jobRepository;
        this.resultRepository = resultRepository;
        this.objectMapper = objectMapper;
    }

    @Async
    public void processTranscription(UUID jobId, File audioFile, String fileName, UUID userId) {
        AnalysisJob job = jobRepository.findById(jobId).orElse(null);
        if (job == null) {
            log.error("Job not found: {}", jobId);
            return;
        }

        try {
            // Update status to PROCESSING
            job.setStatus(AnalysisJob.JobStatus.PROCESSING);
            jobRepository.save(job);

            // Upload to S3 if keys are present (or if config successfully initialized)
            try {
                PutObjectRequest putRequest = PutObjectRequest.builder()
                        .bucket(bucketName)
                        .key(fileName)
                        .build();
                s3Client.putObject(putRequest, RequestBody.fromFile(audioFile));
                log.info("Uploaded to S3: {}", fileName);
            } catch (Exception s3Ex) {
                log.error("S3 upload failed, but proceeding with local file for AI service: {}", s3Ex.getMessage());
            }

            // Call Flask AI service
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", new FileSystemResource(audioFile));

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            ResponseEntity<String> flaskResponse = restTemplate.postForEntity(
                    flaskServiceUrl + "/transcribe", requestEntity, String.class
            );

            log.info("Flask response received for job: {}", jobId);

            // Parse Flask response
            Map<String, Object> responseMap = objectMapper.readValue(
                    flaskResponse.getBody(), new TypeReference<>() {}
            );

            List<String> fillerWordsList = List.of();
            if (responseMap.get("filler_words") != null) {
                try {
                    List<?> rawFillerList = (List<?>) responseMap.get("filler_words");
                    List<String> serializedList = new java.util.ArrayList<>();
                    for (Object item : rawFillerList) {
                        serializedList.add(objectMapper.writeValueAsString(item));
                    }
                    fillerWordsList = serializedList;
                } catch (Exception serializeEx) {
                    log.error("Failed to serialize filler words to JSON strings", serializeEx);
                }
            }

            // Save AnalysisResult
            AnalysisResult result = AnalysisResult.builder()
                    .userId(userId)
                    .audioFileName(fileName)
                    .transcription((String) responseMap.get("transcript"))
                    .fillerWordCount(((Number) responseMap.get("filler_word_count")).intValue())
                    .fillerWords(fillerWordsList)
                    .confidenceScore(((Number) responseMap.get("confidence_score")).doubleValue())
                    .speechPaceWordsPerMin(responseMap.get("speech_pace_wpm") != null ?
                            ((Number) responseMap.get("speech_pace_wpm")).doubleValue() : 0.0)
                    .build();

            resultRepository.save(result);

            // Update job to DONE
            job.setStatus(AnalysisJob.JobStatus.DONE);
            job.setResultPayload(responseMap);
            jobRepository.save(job);

            log.info("Job completed: {}", jobId);

        } catch (Exception e) {
            log.error("Transcription failed for job: {}", jobId, e);
            job.setStatus(AnalysisJob.JobStatus.FAILED);
            job.setErrorMessage(e.getMessage());
            jobRepository.save(job);
        } finally {
            // Clean up temp file
            if (audioFile.exists()) {
                audioFile.delete();
            }
        }
    }
}
