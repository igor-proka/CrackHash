package ru.nsu.prokofiev.crackhash.manager.model;

import lombok.Data;

@Data
public class CrackResponse {
    private String requestId;

    public CrackResponse(String requestId) {
        this.requestId = requestId;
    }
}
