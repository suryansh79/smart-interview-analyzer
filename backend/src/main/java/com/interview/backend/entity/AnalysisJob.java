package com.interview.backend.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "analysis_jobs")
public class AnalysisJob {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "audio_file_name")
    private String audioFileName;

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private JobStatus status;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "result_payload", columnDefinition = "jsonb")
    private Map<String, Object> resultPayload;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    public AnalysisJob() {
    }

    public AnalysisJob(UUID id, UUID userId, String audioFileName, JobStatus status,
                       Map<String, Object> resultPayload, String errorMessage,
                       Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.userId = userId;
        this.audioFileName = audioFileName;
        this.status = status;
        this.resultPayload = resultPayload;
        this.errorMessage = errorMessage;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getAudioFileName() {
        return audioFileName;
    }

    public void setAudioFileName(String audioFileName) {
        this.audioFileName = audioFileName;
    }

    public JobStatus getStatus() {
        return status;
    }

    public void setStatus(JobStatus status) {
        this.status = status;
    }

    public Map<String, Object> getResultPayload() {
        return resultPayload;
    }

    public void setResultPayload(Map<String, Object> resultPayload) {
        this.resultPayload = resultPayload;
    }

    public String getErrorMessage() {
        return errorMessage;
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public enum JobStatus {
        PENDING, PROCESSING, DONE, FAILED
    }

    // Builder
    public static AnalysisJobBuilder builder() {
        return new AnalysisJobBuilder();
    }

    public static class AnalysisJobBuilder {
        private UUID id;
        private UUID userId;
        private String audioFileName;
        private JobStatus status;
        private Map<String, Object> resultPayload;
        private String errorMessage;
        private Instant createdAt;
        private Instant updatedAt;

        AnalysisJobBuilder() {
        }

        public AnalysisJobBuilder id(UUID id) {
            this.id = id;
            return this;
        }

        public AnalysisJobBuilder userId(UUID userId) {
            this.userId = userId;
            return this;
        }

        public AnalysisJobBuilder audioFileName(String audioFileName) {
            this.audioFileName = audioFileName;
            return this;
        }

        public AnalysisJobBuilder status(JobStatus status) {
            this.status = status;
            return this;
        }

        public AnalysisJobBuilder resultPayload(Map<String, Object> resultPayload) {
            this.resultPayload = resultPayload;
            return this;
        }

        public AnalysisJobBuilder errorMessage(String errorMessage) {
            this.errorMessage = errorMessage;
            return this;
        }

        public AnalysisJobBuilder createdAt(Instant createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public AnalysisJobBuilder updatedAt(Instant updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }

        public AnalysisJob build() {
            return new AnalysisJob(id, userId, audioFileName, status, resultPayload, errorMessage, createdAt, updatedAt);
        }
    }
}
