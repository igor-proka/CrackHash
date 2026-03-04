package ru.nsu.prokofiev.crackhash.manager.repository;

import org.springframework.stereotype.Repository;
import ru.nsu.prokofiev.crackhash.manager.model.TaskState;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/**
 * Локальное хранилище задач в оперативной памяти.
 * Использует ConcurrentHashMap для обеспечения потокобезопасности.
 */
@Repository
public class InMemoryTaskRepository implements TaskRepository {
    // Хранилище: ID запроса -> Объект состояния задачи
    private final ConcurrentMap<String, TaskState> store = new ConcurrentHashMap<>();

    @Override
    public void save(TaskState taskState) {
        store.put(taskState.getRequestId(), taskState);
    }

    @Override
    public TaskState findById(String requestId) {
        return store.get(requestId);
    }

    @Override
    public void delete(String requestId) {
        store.remove(requestId);
    }

    @Override
    public Iterable<TaskState> findAll() {
        return store.values();
    }
}
