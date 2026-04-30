package ru.nsu.prokofiev.crackhash.manager.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.domain.Pageable;
import ru.nsu.prokofiev.crackhash.manager.model.TaskPartDocument;

import java.util.Collection;
import java.util.List;

/**
 * Репозиторий MongoDB для частей задач.
 * Используется outbox-планировщиком и сборкой прогресса по завершенным частям.
 */
public interface TaskPartMongoRepository extends MongoRepository<TaskPartDocument, String> {
    List<TaskPartDocument> findByStatusIn(Collection<String> statuses);

    List<TaskPartDocument> findByStatusIn(Collection<String> statuses, Pageable pageable);

    List<TaskPartDocument> findByRequestIdOrderByPartNumberAsc(String requestId);

    long countByRequestIdAndStatus(String requestId, String status);
}
