package ru.nsu.prokofiev.crackhash.manager.model;

import lombok.Data;
import java.time.Instant;
import java.util.List;

/**
 * Сообщение из очереди результатов RabbitMQ.
 * Воркер сообщает этап обработки части: старт, успешное завершение или ошибку попытки.
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
