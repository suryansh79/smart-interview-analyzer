package com.interview.backend.controller;

import com.interview.backend.entity.AnalysisJob;
import com.interview.backend.entity.User;
import com.interview.backend.repository.AnalysisJobRepository;
import com.interview.backend.service.TranscriptionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class UploadController {

    private final AnalysisJobRepository jobRepository;
    private final TranscriptionService transcriptionService;

    public UploadController(AnalysisJobRepository jobRepository,
                            TranscriptionService transcriptionService) {
        this.jobRepository = jobRepository;
        this.transcriptionService = transcriptionService;
    }

    @PostMapping("/upload")
    public ResponseEntity<Map<String, Object>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User user) {

        try {
            // Generate unique filename
            String originalName = file.getOriginalFilename();
            String cleanFileName = originalName != null ? originalName
                    .replaceAll("\\s+", "_")
                    .replaceAll("[^a-zA-Z0-9._-]", "") : "audio.wav";
            String fileName = System.currentTimeMillis() + "_" + cleanFileName;

            // Save to temp
            String tempDir = System.getProperty("user.dir") + "/temp/";
            File directory = new File(tempDir);
            if (!directory.exists()) {
                directory.mkdirs();
            }
            File savedFile = new File(tempDir + File.separator + fileName);
            file.transferTo(savedFile);

            // Create job
            AnalysisJob job = AnalysisJob.builder()
                    .userId(user.getId())
                    .audioFileName(fileName)
                    .status(AnalysisJob.JobStatus.PENDING)
                    .build();
            jobRepository.save(job);

            // Process async
            transcriptionService.processTranscription(
                    job.getId(), savedFile, fileName, user.getId()
            );

            return ResponseEntity.status(HttpStatus.ACCEPTED)
                    .body(Map.of(
                            "jobId", job.getId().toString(),
                            "status", "PENDING",
                            "message", "Upload received. Processing started."
                    ));

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Upload failed: " + e.getMessage()));
        }
    }
}