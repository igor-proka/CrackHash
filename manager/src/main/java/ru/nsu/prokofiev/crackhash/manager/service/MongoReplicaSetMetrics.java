package ru.nsu.prokofiev.crackhash.manager.service;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.MultiGauge;
import io.micrometer.core.instrument.Tags;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.springframework.data.mongodb.MongoDatabaseFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class MongoReplicaSetMetrics {

    private static final List<String> TRACKED_STATES = Arrays.asList(
            "PRIMARY",
            "SECONDARY",
            "STARTUP",
            "RECOVERING",
            "ARBITER",
            "DOWN",
            "ROLLBACK",
            "UNKNOWN"
    );

    private final MongoDatabaseFactory mongoDatabaseFactory;
    private final MeterRegistry meterRegistry;

    private MultiGauge memberStateGauge;
    private MultiGauge memberHealthGauge;

    @PostConstruct
    public void init() {
        memberStateGauge = MultiGauge.builder("crackhash.mongodb.replset.member.state")
                .description("MongoDB replica set member state as one-hot series by member and state")
                .register(meterRegistry);
        memberHealthGauge = MultiGauge.builder("crackhash.mongodb.replset.member.health")
                .description("MongoDB replica set member health, 1 is healthy")
                .register(meterRegistry);
        refreshReplicaSetMetrics();
    }

    @Scheduled(fixedDelay = 5000, initialDelay = 5000)
    public void refreshReplicaSetMetrics() {
        try {
            Document status = mongoDatabaseFactory.getMongoDatabase("admin")
                    .runCommand(new Document("replSetGetStatus", 1));
            List<Document> members = status.getList("members", Document.class, List.of());
            List<MultiGauge.Row<?>> stateRows = new ArrayList<>();
            List<MultiGauge.Row<?>> healthRows = new ArrayList<>();

            for (Document member : members) {
                String name = member.getString("name");
                String state = member.getString("stateStr");
                Number health = member.get("health", Number.class);
                if (health == null) {
                    health = 0;
                }

                for (String trackedState : TRACKED_STATES) {
                    double value = trackedState.equals(state) ? 1.0 : 0.0;
                    stateRows.add(MultiGauge.Row.of(Tags.of("member", name, "state", trackedState), value));
                }
                healthRows.add(MultiGauge.Row.of(Tags.of("member", name), health.doubleValue()));
            }

            memberStateGauge.register(stateRows, true);
            memberHealthGauge.register(healthRows, true);
        } catch (Exception e) {
            log.warn("Failed to refresh MongoDB replica set metrics: {}", e.getMessage());
        }
    }
}
