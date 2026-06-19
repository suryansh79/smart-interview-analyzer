package com.interview.backend.controller;

import com.interview.backend.dto.JobStatusResponse;
import com.interview.backend.entity.AnalysisJob;
import com.interview.backend.entity.User;
import com.interview.backend.exception.ResourceNotFoundException;
import com.interview.backend.repository.AnalysisJobRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api")
public class JobStatusController {

    private final AnalysisJobRepository jobRepository;

    public JobStatusController(AnalysisJobRepository jobRepository) {
        this.jobRepository = jobRepository;
    }

    @GetMapping("/status/{jobId}")
    public ResponseEntity<JobStatusResponse> getJobStatus(
            @PathVariable UUID jobId,
            @AuthenticationPrincipal User user) {

        AnalysisJob job = jobRepository.findByIdAndUserId(jobId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Job not found: " + jobId));

        return ResponseEntity.ok(JobStatusResponse.builder()
                .jobId(job.getId())
                .status(job.getStatus())
                .result(job.getStatus() == AnalysisJob.JobStatus.DONE ? job.getResultPayload() : null)
                .errorMessage(job.getStatus() == AnalysisJob.JobStatus.FAILED ? job.getErrorMessage() : null)
                .build());
    }
}
