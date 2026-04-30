package ru.nsu.prokofiev.crackhash.manager.config;

import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.MongoDatabaseFactory;
import org.springframework.data.mongodb.MongoTransactionManager;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.transaction.support.TransactionTemplate;
import ru.nsu.prokofiev.crackhash.manager.model.CrackTaskDocument;
import ru.nsu.prokofiev.crackhash.manager.model.TaskPartDocument;

@Configuration
public class MongoConfig {

    @Bean
    public MongoTransactionManager mongoTransactionManager(MongoDatabaseFactory databaseFactory) {
        return new MongoTransactionManager(databaseFactory);
    }

    @Bean
    public TransactionTemplate transactionTemplate(MongoTransactionManager mongoTransactionManager) {
        return new TransactionTemplate(mongoTransactionManager);
    }

    @Bean
    public ApplicationRunner mongoCollectionsInitializer(MongoTemplate mongoTemplate) {
        return args -> {
            if (!mongoTemplate.collectionExists(CrackTaskDocument.class)) {
                mongoTemplate.createCollection(CrackTaskDocument.class);
            }
            if (!mongoTemplate.collectionExists(TaskPartDocument.class)) {
                mongoTemplate.createCollection(TaskPartDocument.class);
            }
            mongoTemplate.indexOps(TaskPartDocument.class).ensureIndex(
                    new Index()
                            .on("requestId", Sort.Direction.ASC)
                            .on("partNumber", Sort.Direction.ASC)
                            .unique()
                            .named("request_part_unique")
            );
        };
    }
}
