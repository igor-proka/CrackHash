package ru.nsu.prokofiev.crackhash.manager.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@Document(collection = "crack_task_parts")
@CompoundIndex(name = "request_part_unique", def = "{'requestId': 1, 'partNumber': 1}", unique = true)
/**
 * MongoDB-документ одной части клиентской задачи.
 * Эти записи образуют outbox: manager сначала сохраняет часть здесь,
 * а затем повторяет публикацию в RabbitMQ до успешного confirm.
 */
public class TaskPartDocument {
    @Id
    private String id;
    private String requestId;
    private int partNumber;
    private int partCount;
    private String hash;
    private int maxLength;
    // Алфавит хранится вместе с частью, чтобы переотправка после рестарта не зависела от текущих настроек кода.
    private String alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
    private String status;
    private int publishAttempts;
    private String lastError;
    private String workerId;
    private String attemptId;
    private List<String> results = new ArrayList<>();
    private String processingError;
    private int processingAttempts;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant publishedAt;
    private Instant startedAt;
    private Instant lastHeartbeatAt;
    private Instant completedAt;

    public List<String> getResults() {
        if (results == null) {
            results = new ArrayList<>();
        }
        return results;
    }
}
