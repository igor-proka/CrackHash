package ru.nsu.prokofiev.crackhash.monitoring.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@Document(collection = "crack_requests")
public class CrackTaskDocument {
    @Id
    private String requestId;
    private String hash;
    private int maxLength;
    private String status;
    private List<String> results = new ArrayList<>();
    private int partCount;
    private int completedParts;
    private String lastError;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant completedAt;

    public List<String> getResults() {
        if (results == null) {
            results = new ArrayList<>();
        }
        return results;
    }
}
