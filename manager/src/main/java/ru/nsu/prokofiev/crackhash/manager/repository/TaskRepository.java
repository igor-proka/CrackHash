package ru.nsu.prokofiev.crackhash.manager.repository;

import ru.nsu.prokofiev.crackhash.manager.model.TaskState;

public interface TaskRepository {
    void save(TaskState taskState);
    TaskState findById(String requestId);
    void delete(String requestId);
    Iterable<TaskState> findAll();
}
