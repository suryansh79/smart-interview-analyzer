package com.interview.backend.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "analysis_results")
public class AnalysisResult {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "audio_file_name", nullable = false)
    private String audioFileName;

    @Column(columnDefinition = "TEXT")
    private String transcription;

    @Column(name = "filler_word_count")
    private int fillerWordCount;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "filler_words", columnDefinition = "jsonb")
    private List<String> fillerWords;

    @Column(name = "confidence_score")
    private double confidenceScore;

    @Column(name = "speech_pace_words_per_min")
    private double speechPaceWordsPerMin;

    @Column(name = "created_at")
    private Instant createdAt;

    public AnalysisResult() {
    }

    public AnalysisResult(UUID id, UUID userId, String audioFileName, String transcription,
                          int fillerWordCount, List<String> fillerWords, double confidenceScore,
                          double speechPaceWordsPerMin, Instant createdAt) {
        this.id = id;
        this.userId = userId;
        this.audioFileName = audioFileName;
        this.transcription = transcription;
        this.fillerWordCount = fillerWordCount;
        this.fillerWords = fillerWords;
        this.confidenceScore = confidenceScore;
        this.speechPaceWordsPerMin = speechPaceWordsPerMin;
        this.createdAt = createdAt;
    }

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
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

    public String getTranscription() {
        return transcription;
    }

    public void setTranscription(String transcription) {
        this.transcription = transcription;
    }

    public int getFillerWordCount() {
        return fillerWordCount;
    }

    public void setFillerWordCount(int fillerWordCount) {
        this.fillerWordCount = fillerWordCount;
    }

    public List<String> getFillerWords() {
        return fillerWords;
    }

    public void setFillerWords(List<String> fillerWords) {
        this.fillerWords = fillerWords;
    }

    public double getConfidenceScore() {
        return confidenceScore;
    }

    public void setConfidenceScore(double confidenceScore) {
        this.confidenceScore = confidenceScore;
    }

    public double getSpeechPaceWordsPerMin() {
        return speechPaceWordsPerMin;
    }

    public void setSpeechPaceWordsPerMin(double speechPaceWordsPerMin) {
        this.speechPaceWordsPerMin = speechPaceWordsPerMin;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    // Builder
    public static AnalysisResultBuilder builder() {
        return new AnalysisResultBuilder();
    }

    public static class AnalysisResultBuilder {
        private UUID id;
        private UUID userId;
        private String audioFileName;
        private String transcription;
        private int fillerWordCount;
        private List<String> fillerWords;
        private double confidenceScore;
        private double speechPaceWordsPerMin;
        private Instant createdAt;

        AnalysisResultBuilder() {
        }

        public AnalysisResultBuilder id(UUID id) {
            this.id = id;
            return this;
        }

        public AnalysisResultBuilder userId(UUID userId) {
            this.userId = userId;
            return this;
        }

        public AnalysisResultBuilder audioFileName(String audioFileName) {
            this.audioFileName = audioFileName;
            return this;
        }

        public AnalysisResultBuilder transcription(String transcription) {
            this.transcription = transcription;
            return this;
        }

        public AnalysisResultBuilder fillerWordCount(int fillerWordCount) {
            this.fillerWordCount = fillerWordCount;
            return this;
        }

        public AnalysisResultBuilder fillerWords(List<String> fillerWords) {
            this.fillerWords = fillerWords;
            return this;
        }

        public AnalysisResultBuilder confidenceScore(double confidenceScore) {
            this.confidenceScore = confidenceScore;
            return this;
        }

        public AnalysisResultBuilder speechPaceWordsPerMin(double speechPaceWordsPerMin) {
            this.speechPaceWordsPerMin = speechPaceWordsPerMin;
            return this;
        }

        public AnalysisResultBuilder createdAt(Instant createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public AnalysisResult build() {
            return new AnalysisResult(id, userId, audioFileName, transcription, fillerWordCount,
                    fillerWords, confidenceScore, speechPaceWordsPerMin, createdAt);
        }
    }
}
