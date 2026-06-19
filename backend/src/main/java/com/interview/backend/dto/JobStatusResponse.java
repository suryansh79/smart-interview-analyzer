package com.interview.backend.dto;

import com.interview.backend.entity.AnalysisJob;

import java.util.Map;
import java.util.UUID;

public class JobStatusResponse {
    private UUID jobId;
    private AnalysisJob.JobStatus status;
    private Map<String, Object> result;
    private String errorMessage;

    public JobStatusResponse() {
    }

    public JobStatusResponse(UUID jobId, AnalysisJob.JobStatus status, Map<String, Object> result, String errorMessage) {
        this.jobId = jobId;
        this.status = status;
        this.result = result;
        this.errorMessage = errorMessage;
    }

    public UUID getJobId() {
        return jobId;
    }

    public void setJobId(UUID jobId) {
        this.jobId = jobId;
    }

    public AnalysisJob.JobStatus getStatus() {
        return status;
    }

    public void setStatus(AnalysisJob.JobStatus status) {
        this.status = status;
    }

    public Map<String, Object> getResult() {
        return result;
    }

    public void setResult(Map<String, Object> result) {
        this.result = result;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    // Builder
    public static JobStatusResponseBuilder builder() {
        return new JobStatusResponseBuilder();
    }

    public static class JobStatusResponseBuilder {
        private UUID jobId;
        private AnalysisJob.JobStatus status;
        private Map<String, Object> result;
        private String errorMessage;

        JobStatusResponseBuilder() {
        }

        public JobStatusResponseBuilder jobId(UUID jobId) {
            this.jobId = jobId;
            return this;
        }

        public JobStatusResponseBuilder status(AnalysisJob.JobStatus status) {
            this.status = status;
            return this;
        }

        public JobStatusResponseBuilder result(Map<String, Object> result) {
            this.result = result;
            return this;
        }

        public JobStatusResponseBuilder errorMessage(String errorMessage) {
            this.errorMessage = errorMessage;
            return this;
        }

        public JobStatusResponse build() {
            return new JobStatusResponse(jobId, status, result, errorMessage);
        }
    }
}
