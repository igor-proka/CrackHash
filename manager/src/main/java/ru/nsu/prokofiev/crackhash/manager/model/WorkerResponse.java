package ru.nsu.prokofiev.crackhash.manager.model;

import lombok.Data;
import java.util.List;

@Data
public class WorkerResponse {
    private String requestId;
    private int partNumber;
    private List<String> crackedWords;
}
