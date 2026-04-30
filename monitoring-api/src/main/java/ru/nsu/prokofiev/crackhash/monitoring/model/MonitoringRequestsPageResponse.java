package ru.nsu.prokofiev.crackhash.monitoring.model;

import lombok.Data;

import java.util.List;

@Data
public class MonitoringRequestsPageResponse {
    private List<MonitoringRequestSummaryResponse> items;
    private int page;
    private int size;
    private int totalPages;
    private long totalItems;
    private String sort;
    private String status;
}
