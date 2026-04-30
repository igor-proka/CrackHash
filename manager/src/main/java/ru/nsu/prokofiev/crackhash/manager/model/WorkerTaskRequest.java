package ru.nsu.prokofiev.crackhash.manager.model;

import lombok.Data;

/**
 * Сообщение, которое manager публикует в очередь задач RabbitMQ.
 * Каждое сообщение описывает одну часть общего пространства перебора.
 */
@Data
public class WorkerTaskRequest {
    private String requestId;
    private int partNumber;
    private int partCount;
    private String hash;
    private int maxLength;
    private String alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
}
