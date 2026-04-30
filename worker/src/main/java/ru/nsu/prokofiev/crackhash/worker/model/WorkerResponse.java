package ru.nsu.prokofiev.crackhash.worker.model;

import lombok.Data;
import java.time.Instant;
import java.util.List;

/**
 * Ответ воркера для manager.
 * Сообщение публикуется в results-очередь и описывает этап обработки своей части перебора.
 */
@Data
public class WorkerResponse {
    private String eventType;
    private String requestId;
    private int partNumber;
    private String workerId;
    private String attemptId;
    private Instant occurredAt;
    private List<String> crackedWords;
    private String errorMessage;
}
