package ru.nsu.prokofiev.crackhash.manager.model;

import lombok.Data;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Описание внутреннего состояния задачи на стороне Менеджера.
 */
@Data
public class TaskState {
    private String requestId;   // Уникальный ID запроса (UUID)
    private String hash;        // Искомый хэш
    private int maxLength;      // Макс. длина слова
    private long creationTime;  // Время создания (для замера таймаута)
    private String status;      // Текущий статус: IN_PROGRESS, READY, ERROR
    private List<String> results = new ArrayList<>(); // Найденные слова
    private int pendingParts;   // На сколько частей разбита задача (использовалось 3 воркера)
    private AtomicInteger receivedParts = new AtomicInteger(0); // Счетчик полученных ответов от воркеров
}
