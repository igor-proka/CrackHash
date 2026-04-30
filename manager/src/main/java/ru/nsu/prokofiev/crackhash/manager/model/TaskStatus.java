package ru.nsu.prokofiev.crackhash.manager.model;

/**
 * Статусы клиентской задачи, которые возвращаются наружу через REST API.
 */
public final class TaskStatus {
    public static final String QUEUED = "QUEUED";
    public static final String IN_PROGRESS = "IN_PROGRESS";
    public static final String READY = "READY";
    public static final String ERROR = "ERROR";

    private TaskStatus() {
    }
}
