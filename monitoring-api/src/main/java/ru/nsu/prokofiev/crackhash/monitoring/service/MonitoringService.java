package ru.nsu.prokofiev.crackhash.monitoring.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import ru.nsu.prokofiev.crackhash.monitoring.model.CrackTaskDocument;
import ru.nsu.prokofiev.crackhash.monitoring.model.MonitoringRequestDetailsResponse;
import ru.nsu.prokofiev.crackhash.monitoring.model.MonitoringRequestsPageResponse;
import ru.nsu.prokofiev.crackhash.monitoring.model.MonitoringRequestSummaryResponse;
import ru.nsu.prokofiev.crackhash.monitoring.model.MonitoringTaskPartResponse;
import ru.nsu.prokofiev.crackhash.monitoring.model.TaskPartDocument;
import ru.nsu.prokofiev.crackhash.monitoring.model.TaskPartStatus;
import ru.nsu.prokofiev.crackhash.monitoring.repository.CrackTaskMongoRepository;
import ru.nsu.prokofiev.crackhash.monitoring.repository.TaskPartMongoRepository;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MonitoringService {

    private final CrackTaskMongoRepository taskRepository;
    private final TaskPartMongoRepository partRepository;

    public MonitoringRequestsPageResponse getRequests(int page, int size, String sort, String status) {
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(size, 100));
        String safeSort = normalizeSort(sort);
        String safeStatus = normalizeStatus(status);
        Instant now = Instant.now();

        Sort.Direction direction = "oldest".equals(safeSort) ? Sort.Direction.ASC : Sort.Direction.DESC;
        PageRequest pageRequest = PageRequest.of(safePage, safeSize, Sort.by(direction, "createdAt"));
        Page<CrackTaskDocument> taskPage = safeStatus == null
                ? taskRepository.findAll(pageRequest)
                : taskRepository.findByStatus(safeStatus, pageRequest);

        List<MonitoringRequestSummaryResponse> items = taskPage
                .stream()
                .map(task -> toSummary(task, now))
                .collect(Collectors.toList());

        MonitoringRequestsPageResponse response = new MonitoringRequestsPageResponse();
        response.setItems(items);
        response.setPage(taskPage.getNumber());
        response.setSize(taskPage.getSize());
        response.setTotalPages(taskPage.getTotalPages());
        response.setTotalItems(taskPage.getTotalElements());
        response.setSort(safeSort);
        response.setStatus(safeStatus);
        return response;
    }

    public MonitoringRequestDetailsResponse getRequestDetails(String requestId) {
        Instant now = Instant.now();
        CrackTaskDocument task = taskRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Unknown request: " + requestId));
        List<MonitoringTaskPartResponse> parts = partRepository.findByRequestIdOrderByPartNumberAsc(requestId)
                .stream()
                .map(part -> toPartResponse(part, now))
                .collect(Collectors.toList());

        MonitoringRequestDetailsResponse response = new MonitoringRequestDetailsResponse();
        response.setRequestId(task.getRequestId());
        response.setHash(task.getHash());
        response.setMaxLength(task.getMaxLength());
        response.setStatus(task.getStatus());
        response.setResults(task.getResults());
        response.setPartCount(task.getPartCount());
        response.setCompletedParts(task.getCompletedParts());
        response.setLastError(task.getLastError());
        response.setCreatedAt(task.getCreatedAt());
        response.setUpdatedAt(task.getUpdatedAt());
        response.setCompletedAt(task.getCompletedAt());
        response.setTotalDurationMs(durationMs(task.getCreatedAt(), task.getCompletedAt(), now));
        response.setParts(parts);
        return response;
    }

    private MonitoringRequestSummaryResponse toSummary(CrackTaskDocument task, Instant now) {
        MonitoringRequestSummaryResponse response = new MonitoringRequestSummaryResponse();
        response.setRequestId(task.getRequestId());
        response.setHash(task.getHash());
        response.setMaxLength(task.getMaxLength());
        response.setStatus(task.getStatus());
        response.setResults(task.getResults());
        response.setPartCount(task.getPartCount());
        response.setCompletedParts(task.getCompletedParts());
        response.setLastError(task.getLastError());
        response.setCreatedAt(task.getCreatedAt());
        response.setUpdatedAt(task.getUpdatedAt());
        response.setCompletedAt(task.getCompletedAt());
        response.setTotalDurationMs(durationMs(task.getCreatedAt(), task.getCompletedAt(), now));
        return response;
    }

    private MonitoringTaskPartResponse toPartResponse(TaskPartDocument part, Instant now) {
        MonitoringTaskPartResponse response = new MonitoringTaskPartResponse();
        response.setId(part.getId());
        response.setRequestId(part.getRequestId());
        response.setPartNumber(part.getPartNumber());
        response.setPartCount(part.getPartCount());
        response.setStatus(part.getStatus());
        response.setWorkerId(part.getWorkerId());
        response.setAttemptId(part.getAttemptId());
        response.setResults(part.getResults());
        response.setPublishAttempts(part.getPublishAttempts());
        response.setLastError(part.getLastError());
        response.setProcessingError(part.getProcessingError());
        response.setCreatedAt(part.getCreatedAt());
        response.setUpdatedAt(part.getUpdatedAt());
        response.setPublishedAt(part.getPublishedAt());
        response.setStartedAt(part.getStartedAt());
        response.setLastHeartbeatAt(part.getLastHeartbeatAt());
        response.setCompletedAt(part.getCompletedAt());
        response.setQueueWaitMs(durationMs(part.getCreatedAt(), part.getStartedAt(), now));
        response.setRunningMs(hasRun(part) ? durationMs(part.getStartedAt(), part.getCompletedAt(), now) : null);
        response.setTotalDurationMs(durationMs(part.getCreatedAt(), part.getCompletedAt(), now));
        return response;
    }

    private boolean hasRun(TaskPartDocument part) {
        return TaskPartStatus.PROCESSING.equals(part.getStatus())
                || TaskPartStatus.COMPLETED.equals(part.getStatus());
    }

    private String normalizeSort(String sort) {
        if (sort == null) {
            return "newest";
        }

        String value = sort.toLowerCase(Locale.ROOT);
        return "oldest".equals(value) ? "oldest" : "newest";
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank() || "ALL".equalsIgnoreCase(status)) {
            return null;
        }

        return status.toUpperCase(Locale.ROOT);
    }

    private Long durationMs(Instant start, Instant finish, Instant fallbackFinish) {
        if (start == null) {
            return null;
        }

        Instant end = finish == null ? fallbackFinish : finish;
        return Math.max(0, Duration.between(start, end).toMillis());
    }
}
