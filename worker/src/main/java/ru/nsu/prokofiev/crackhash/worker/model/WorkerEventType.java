package ru.nsu.prokofiev.crackhash.worker.model;

/**
 * Тип события, которое воркер отправляет менеджеру через очередь результатов.
 */
public final class WorkerEventType {
    public static final String STARTED = "STARTED";
    public static final String COMPLETED = "COMPLETED";
    public static final String FAILED = "FAILED";

    private WorkerEventType() {
    }
}
