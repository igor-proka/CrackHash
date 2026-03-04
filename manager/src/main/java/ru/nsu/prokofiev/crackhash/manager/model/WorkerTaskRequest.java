package ru.nsu.prokofiev.crackhash.manager.model;

import lombok.Data;

@Data
public class WorkerTaskRequest {
    private String requestId;
    private int partNumber;
    private int partCount;
    private String hash;
    private int maxLength;
    private String alphabet = "abcdefghijklmnopqrstuvwxyz0123456789"; 
}
