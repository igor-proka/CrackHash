package ru.nsu.prokofiev.crackhash.worker.service;

import java.util.List;
import ru.nsu.prokofiev.crackhash.worker.model.WorkerTaskRequest;

public interface HashCracker {
    List<String> crack(WorkerTaskRequest task);
}
