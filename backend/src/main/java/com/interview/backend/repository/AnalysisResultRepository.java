package com.interview.backend.repository;

import com.interview.backend.entity.AnalysisResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AnalysisResultRepository extends JpaRepository<AnalysisResult, UUID> {
    List<AnalysisResult> findByUserIdOrderByCreatedAtDesc(UUID userId);
    List<AnalysisResult> findTop10ByUserIdOrderByCreatedAtDesc(UUID userId);
}
