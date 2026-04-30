package ru.nsu.prokofiev.crackhash.monitoring.model;

import lombok.Data;

import java.time.Instant;
import java.util.List;

@Data
public class MonitoringTaskPartResponse {
    private String id;
    private String requestId;
    private int partNumber;
    private int partCount;
    private String status;
    private String workerId;
    private String attemptId;
    private List<String> results;
    private int publishAttempts;
    private String lastError;
    private String processingError;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant publishedAt;
    private Instant startedAt;
    private Instant lastHeartbeatAt;
    private Instant completedAt;
    private Long queueWaitMs;
    private Long runningMs;
    private Long totalDurationMs;
}
