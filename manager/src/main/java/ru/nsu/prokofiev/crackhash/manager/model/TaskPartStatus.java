package ru.nsu.prokofiev.crackhash.manager.model;

/**
 * Внутренние статусы отдельной части задачи.
 * По ним outbox понимает, что нужно публиковать повторно, а manager отличает уже обработанные дубли.
 */
public final class TaskPartStatus {
    public static final String PENDING_PUBLISH = "PENDING_PUBLISH";
    public static final String PUBLISH_FAILED = "PUBLISH_FAILED";
    public static final String PUBLISHED = "PUBLISHED";
    public static final String PROCESSING = "PROCESSING";
    public static final String COMPLETED = "COMPLETED";
    public static final String FAILED = "FAILED";

    private TaskPartStatus() {
    }
}
