package com.interview.backend.controller;

import com.interview.backend.entity.AnalysisResult;
import com.interview.backend.entity.User;
import com.interview.backend.repository.AnalysisResultRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class HistoryController {

    private final AnalysisResultRepository resultRepository;

    public HistoryController(AnalysisResultRepository resultRepository) {
        this.resultRepository = resultRepository;
    }

    @GetMapping("/history")
    public ResponseEntity<List<AnalysisResult>> getHistory(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(
                resultRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
        );
    }
}
