package ru.nsu.prokofiev.crackhash.manager.model;

import lombok.Data;

import java.util.List;

/**
 * Ответ manager на GET /api/hash/status.
 * data заполняется только для READY, чтобы клиент видел результат после завершения всех частей.
 */
@Data
public class StatusResponse {
    private String status;
    private List<String> data;

    public StatusResponse(String status, List<String> data) {
        this.status = status;
        this.data = data;
    }
}
