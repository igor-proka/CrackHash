package ru.nsu.prokofiev.crackhash.worker.service;

import java.util.List;
import ru.nsu.prokofiev.crackhash.worker.model.WorkerTaskRequest;

/**
 * Контракт вычислительного компонента воркера.
 * Реализация получает одну часть пространства слов и возвращает найденные совпадения.
 */
public interface HashCracker {
    List<String> crack(WorkerTaskRequest task);
}
