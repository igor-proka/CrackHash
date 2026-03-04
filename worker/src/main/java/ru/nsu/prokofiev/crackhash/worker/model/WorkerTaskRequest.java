package ru.nsu.prokofiev.crackhash.worker.model;

import lombok.Data;

/**
 * Запрос от Менеджера к Воркеру на выполнение части задачи.
 */
@Data
public class WorkerTaskRequest {
    private String requestId;   // Уникальный ID основного запроса
    private int partNumber;     // Номер текущей части (воркера)
    private int partCount;      // Общее количество частей (воркеров)
    private String hash;        // Искомый хэш
    private int maxLength;      // Максимально возможная длина слова
    private String alphabet = "abcdefghijklmnopqrstuvwxyz0123456789"; // Алфавит для перебора
}
