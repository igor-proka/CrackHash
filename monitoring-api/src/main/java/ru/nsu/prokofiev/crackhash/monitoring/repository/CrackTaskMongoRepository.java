package ru.nsu.prokofiev.crackhash.monitoring.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import ru.nsu.prokofiev.crackhash.monitoring.model.CrackTaskDocument;

public interface CrackTaskMongoRepository extends MongoRepository<CrackTaskDocument, String> {
    Page<CrackTaskDocument> findByStatus(String status, Pageable pageable);
}
