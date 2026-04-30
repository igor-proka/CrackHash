package ru.nsu.prokofiev.crackhash.monitoring.model;

import lombok.Data;

import java.time.Instant;
import java.util.List;

@Data
public class MonitoringRequestSummaryResponse {
    private String requestId;
    private String hash;
    private int maxLength;
    private String status;
    private List<String> results;
    private int partCount;
    private int completedParts;
    private String lastError;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant completedAt;
    private Long totalDurationMs;
}
