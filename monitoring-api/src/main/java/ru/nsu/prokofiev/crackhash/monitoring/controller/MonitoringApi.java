package ru.nsu.prokofiev.crackhash.monitoring.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import ru.nsu.prokofiev.crackhash.monitoring.model.MonitoringRequestDetailsResponse;
import ru.nsu.prokofiev.crackhash.monitoring.model.MonitoringRequestsPageResponse;
import ru.nsu.prokofiev.crackhash.monitoring.service.MonitoringService;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/monitoring")
@RequiredArgsConstructor
public class MonitoringApi {

    private final MonitoringService monitoringService;

    @GetMapping("/requests")
    public ResponseEntity<MonitoringRequestsPageResponse> getRequests(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", required = false) Integer size,
            @RequestParam(name = "limit", required = false) Integer limit,
            @RequestParam(name = "sort", defaultValue = "newest") String sort,
            @RequestParam(name = "status", required = false) String status
    ) {
        int pageSize = size != null ? size : (limit != null ? limit : 50);
        return ResponseEntity.ok(monitoringService.getRequests(page, pageSize, sort, status));
    }

    @GetMapping("/requests/{requestId}")
    public ResponseEntity<MonitoringRequestDetailsResponse> getRequestDetails(@PathVariable String requestId) {
        try {
            return ResponseEntity.ok(monitoringService.getRequestDetails(requestId));
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage(), e);
        }
    }
}
