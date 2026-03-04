package ru.nsu.prokofiev.crackhash.worker.model;

import lombok.Data;
import java.util.List;

@Data
public class WorkerResponse {
    private String requestId;
    private int partNumber;
    private List<String> crackedWords;
}
