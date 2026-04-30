package ru.nsu.prokofiev.crackhash.manager.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.domain.Pageable;
import ru.nsu.prokofiev.crackhash.manager.model.CrackTaskDocument;

import java.util.List;

/**
 * Репозиторий MongoDB для основного документа клиентского запроса.
 */
public interface CrackTaskMongoRepository extends MongoRepository<CrackTaskDocument, String> {
    List<CrackTaskDocument> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
