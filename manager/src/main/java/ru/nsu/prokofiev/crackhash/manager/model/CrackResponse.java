package ru.nsu.prokofiev.crackhash.manager.model;

import lombok.Data;

/**
 * Ответ manager на создание задачи.
 * requestId можно использовать для дальнейшего polling статуса.
 */
@Data
public class CrackResponse {
    private String requestId;

    public CrackResponse(String requestId) {
        this.requestId = requestId;
    }
}
