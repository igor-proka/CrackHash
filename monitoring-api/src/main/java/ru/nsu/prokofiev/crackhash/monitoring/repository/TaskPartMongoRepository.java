package ru.nsu.prokofiev.crackhash.monitoring.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import ru.nsu.prokofiev.crackhash.monitoring.model.TaskPartDocument;

import java.util.List;

public interface TaskPartMongoRepository extends MongoRepository<TaskPartDocument, String> {
    List<TaskPartDocument> findByRequestIdOrderByPartNumberAsc(String requestId);
}
