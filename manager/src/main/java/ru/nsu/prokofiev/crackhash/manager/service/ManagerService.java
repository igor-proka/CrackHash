package ru.nsu.prokofiev.crackhash.manager.service;

import com.rabbitmq.client.Channel;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.MessageDeliveryMode;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.connection.CorrelationData;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.AmqpHeaders;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import ru.nsu.prokofiev.crackhash.manager.model.CrackRequest;
import ru.nsu.prokofiev.crackhash.manager.model.CrackTaskDocument;
import ru.nsu.prokofiev.crackhash.manager.model.StatusResponse;
import ru.nsu.prokofiev.crackhash.manager.model.TaskPartDocument;
import ru.nsu.prokofiev.crackhash.manager.model.TaskPartStatus;
import ru.nsu.prokofiev.crackhash.manager.model.TaskStatus;
import ru.nsu.prokofiev.crackhash.manager.model.WorkerEventType;
import ru.nsu.prokofiev.crackhash.manager.model.WorkerResponse;
import ru.nsu.prokofiev.crackhash.manager.model.WorkerTaskRequest;
import ru.nsu.prokofiev.crackhash.manager.repository.CrackTaskMongoRepository;
import ru.nsu.prokofiev.crackhash.manager.repository.TaskPartMongoRepository;

import java.io.IOException;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

/**
 * Центральная бизнес-логика менеджера.
 * Менеджер принимает клиентские запросы, хранит состояние в MongoDB,
 * публикует части задач в RabbitMQ и идемпотентно собирает ответы воркеров.
 */
@Slf4j
@Service
public class ManagerService {

    private final CrackTaskMongoRepository taskRepository;
    private final TaskPartMongoRepository partRepository;
    private final RabbitTemplate rabbitTemplate;
    private final TransactionTemplate transactionTemplate;
    private final Counter acceptedRequestsCounter;
    private final Counter completedRequestsCounter;
    private final Counter publishFailureCounter;

    @Value("${task.partition.count:3}")
    private int taskPartitionCount;

    @Value("${crackhash.rabbitmq.tasks-exchange}")
    private String tasksExchange;

    @Value("${crackhash.rabbitmq.tasks-routing-key}")
    private String tasksRoutingKey;

    public ManagerService(
            CrackTaskMongoRepository taskRepository,
            TaskPartMongoRepository partRepository,
            RabbitTemplate rabbitTemplate,
            TransactionTemplate transactionTemplate,
            MeterRegistry meterRegistry
    ) {
        this.taskRepository = taskRepository;
        this.partRepository = partRepository;
        this.rabbitTemplate = rabbitTemplate;
        this.transactionTemplate = transactionTemplate;
        this.acceptedRequestsCounter = Counter.builder("crackhash.requests.accepted")
                .description("Количество запросов, успешно сохраненных менеджером")
                .register(meterRegistry);
        this.completedRequestsCounter = Counter.builder("crackhash.requests.completed")
                .description("Количество запросов, завершенных менеджером")
                .register(meterRegistry);
        this.publishFailureCounter = Counter.builder("crackhash.tasks.publish.failures")
                .description("Количество неудачных попыток публикации частей задачи")
                .register(meterRegistry);
    }

    /**
     * Сохраняет новый запрос и все его части в MongoDB.
     * requestId возвращается клиенту только после успешного commit транзакции.
     */
    public String createCrackTask(CrackRequest request) {
        return executeWithMongoRetry(() -> transactionTemplate.execute(status -> createCrackTaskInTransaction(request)));
    }

    private String createCrackTaskInTransaction(CrackRequest request) {
        String requestId = UUID.randomUUID().toString();
        Instant now = Instant.now();
        int partCount = Math.max(1, taskPartitionCount);

        CrackTaskDocument task = new CrackTaskDocument();
        task.setRequestId(requestId);
        task.setHash(request.getHash());
        task.setMaxLength(request.getMaxLength());
        task.setStatus(TaskStatus.QUEUED);
        task.setPartCount(partCount);
        task.setCompletedParts(0);
        task.setCreatedAt(now);
        task.setUpdatedAt(now);
        taskRepository.save(task);

        for (int partNumber = 1; partNumber <= partCount; partNumber += 1) {
            TaskPartDocument part = new TaskPartDocument();
            part.setId(buildPartId(requestId, partNumber));
            part.setRequestId(requestId);
            part.setPartNumber(partNumber);
            part.setPartCount(partCount);
            part.setHash(request.getHash());
            part.setMaxLength(request.getMaxLength());
            part.setStatus(TaskPartStatus.PENDING_PUBLISH);
            part.setCreatedAt(now);
            part.setUpdatedAt(now);
            partRepository.save(part);
        }

        acceptedRequestsCounter.increment();
        log.info("Saved request {} with {} parts", requestId, partCount);
        return requestId;
    }

    public StatusResponse getTaskStatus(String requestId) {
        return taskRepository.findById(requestId)
                .map(task -> new StatusResponse(
                        task.getStatus(),
                        TaskStatus.READY.equals(task.getStatus()) ? task.getResults() : null
                ))
                .orElseGet(() -> new StatusResponse(TaskStatus.ERROR, null));
    }

    /**
     * Outbox-планировщик: регулярно ищет части, которые еще не ушли в RabbitMQ,
     * и повторяет публикацию после временных отказов брокера.
     */
    @Scheduled(fixedDelay = 2000)
    public void publishPendingParts() {
        List<TaskPartDocument> parts = partRepository.findByStatusIn(Arrays.asList(
                TaskPartStatus.PENDING_PUBLISH,
                TaskPartStatus.PUBLISH_FAILED
        ), PageRequest.of(0, 50));

        for (TaskPartDocument part : parts) {
            publishPart(part);
        }
    }

    public void publishPart(TaskPartDocument part) {
        try {
            WorkerTaskRequest taskRequest = toWorkerTaskRequest(part);

            // Outbox-публикация: сначала часть уже лежит в MongoDB, и только потом мы пытаемся отдать ее RabbitMQ.
            // Если RabbitMQ недоступен или confirm не пришел, статус останется PUBLISH_FAILED и scheduler попробует снова.
            CorrelationData correlationData = new CorrelationData(part.getId());
            rabbitTemplate.convertAndSend(tasksExchange, tasksRoutingKey, taskRequest, message -> {
                message.getMessageProperties().setDeliveryMode(MessageDeliveryMode.PERSISTENT);
                message.getMessageProperties().setMessageId(part.getId());
                message.getMessageProperties().setCorrelationId(part.getId());
                return message;
            }, correlationData);
            waitForPublisherConfirm(correlationData);

            Instant now = Instant.now();
            executeWithMongoRetry(() -> {
                transactionTemplate.executeWithoutResult(status -> {
                TaskPartDocument latestPart = partRepository.findById(part.getId()).orElse(part);

                // Быстрая задача может уже завершиться до того, как поток публикации обновит статус.
                // Поэтому не перезаписываем COMPLETED обратно в PUBLISHED старой копией документа.
                if (isExecutionStarted(latestPart)) {
                    return;
                }

                latestPart.setStatus(TaskPartStatus.PUBLISHED);
                latestPart.setUpdatedAt(now);
                latestPart.setPublishedAt(now);
                latestPart.setLastError(null);
                partRepository.save(latestPart);
                moveTaskToInProgress(latestPart.getRequestId(), now);
                });
                return null;
            });
            log.info("Published part {}/{} for request {}", part.getPartNumber(), part.getPartCount(), part.getRequestId());
        } catch (Exception e) {
            TaskPartDocument latestPartAfterFailure = partRepository.findById(part.getId()).orElse(part);
            if (isExecutionStarted(latestPartAfterFailure)) {
                log.debug("Publish bookkeeping for part {}/{} of request {} lost a race with worker event",
                        part.getPartNumber(), part.getPartCount(), part.getRequestId());
                return;
            }

            executeWithMongoRetry(() -> {
                transactionTemplate.executeWithoutResult(status -> {
                TaskPartDocument latestPart = partRepository.findById(part.getId()).orElse(latestPartAfterFailure);

                // Если ответ уже обработан, ошибка подтверждения публикации больше не должна портить финальный статус.
                if (isExecutionStarted(latestPart)) {
                    return;
                }

                latestPart.setStatus(TaskPartStatus.PUBLISH_FAILED);
                latestPart.setPublishAttempts(latestPart.getPublishAttempts() + 1);
                latestPart.setLastError(e.getMessage());
                latestPart.setUpdatedAt(Instant.now());
                partRepository.save(latestPart);
                });
                return null;
            });
            publishFailureCounter.increment();
            log.warn("Failed to publish part {} for request {}: {}", part.getPartNumber(), part.getRequestId(), e.getMessage());
        }
    }

    @RabbitListener(queues = "${crackhash.rabbitmq.results-queue}")
    public void receiveWorkerResponse(
            WorkerResponse response,
            Channel channel,
            @Header(AmqpHeaders.DELIVERY_TAG) long deliveryTag
    ) throws IOException {
        try {
            executeWithMongoRetry(() -> {
                transactionTemplate.executeWithoutResult(status -> processWorkerResponse(response));
                return null;
            });

            // Ack отправляем только после записи результата в MongoDB: так ответ воркера не потеряется при падении менеджера.
            channel.basicAck(deliveryTag, false);
        } catch (NonRetryableWorkerResponseException e) {
            log.warn("Dropping bad worker response: {}", e.getMessage());
            channel.basicAck(deliveryTag, false);
        } catch (Exception e) {
            String requestId = response == null ? null : response.getRequestId();
            Integer partNumber = response == null ? null : response.getPartNumber();
            log.error("Failed to process worker response for request {} part {}",
                    requestId, partNumber, e);
            channel.basicNack(deliveryTag, false, true);
        }
    }

    public void processWorkerResponse(WorkerResponse response) {
        validateWorkerResponse(response);
        String eventType = response.getEventType() == null ? WorkerEventType.COMPLETED : response.getEventType();

        if (WorkerEventType.STARTED.equals(eventType)) {
            processWorkerStarted(response);
            return;
        }

        if (WorkerEventType.FAILED.equals(eventType)) {
            processWorkerFailed(response);
            return;
        }

        processWorkerCompleted(response);
    }

    private void processWorkerStarted(WorkerResponse response) {
        String partId = buildPartId(response.getRequestId(), response.getPartNumber());
        TaskPartDocument part = partRepository.findById(partId)
                .orElseThrow(() -> new NonRetryableWorkerResponseException("Unknown task part: " + partId));

        if (TaskPartStatus.COMPLETED.equals(part.getStatus())) {
            log.info("Started event for completed part {} ignored", partId);
            return;
        }

        Instant eventTime = response.getOccurredAt() == null ? Instant.now() : response.getOccurredAt();
        part.setStatus(TaskPartStatus.PROCESSING);
        part.setWorkerId(response.getWorkerId());
        part.setAttemptId(response.getAttemptId());
        part.setStartedAt(eventTime);
        part.setLastHeartbeatAt(eventTime);
        part.setProcessingAttempts(part.getProcessingAttempts() + 1);
        part.setProcessingError(null);
        part.setUpdatedAt(eventTime);
        partRepository.save(part);

        moveTaskToInProgress(response.getRequestId(), eventTime);
    }

    private void processWorkerFailed(WorkerResponse response) {
        String partId = buildPartId(response.getRequestId(), response.getPartNumber());
        TaskPartDocument part = partRepository.findById(partId)
                .orElseThrow(() -> new NonRetryableWorkerResponseException("Unknown task part: " + partId));

        if (TaskPartStatus.COMPLETED.equals(part.getStatus())) {
            log.info("Failed event for completed part {} ignored", partId);
            return;
        }

        Instant eventTime = response.getOccurredAt() == null ? Instant.now() : response.getOccurredAt();
        part.setStatus(TaskPartStatus.FAILED);
        part.setWorkerId(response.getWorkerId());
        part.setAttemptId(response.getAttemptId());
        part.setProcessingError(response.getErrorMessage());
        part.setLastError(response.getErrorMessage());
        part.setUpdatedAt(eventTime);
        partRepository.save(part);

        taskRepository.findById(response.getRequestId()).ifPresent(task -> {
            if (!TaskStatus.READY.equals(task.getStatus())) {
                task.setStatus(TaskStatus.ERROR);
                task.setLastError(response.getErrorMessage());
                task.setUpdatedAt(eventTime);
                taskRepository.save(task);
            }
        });
    }

    private void processWorkerCompleted(WorkerResponse response) {
        String partId = buildPartId(response.getRequestId(), response.getPartNumber());
        TaskPartDocument part = partRepository.findById(partId)
                .orElseThrow(() -> new NonRetryableWorkerResponseException("Unknown task part: " + partId));

        if (TaskPartStatus.COMPLETED.equals(part.getStatus())) {
            log.info("Duplicate response for completed part {} ignored", partId);
            return;
        }

        CrackTaskDocument task = taskRepository.findById(response.getRequestId())
                .orElseThrow(() -> new NonRetryableWorkerResponseException("Unknown request: " + response.getRequestId()));

        if (response.getCrackedWords() != null) {
            for (String word : response.getCrackedWords()) {
                // Один и тот же результат может прийти повторно после redelivery, поэтому храним только уникальные слова.
                if (!task.getResults().contains(word)) {
                    task.getResults().add(word);
                }
            }
        }

        Instant now = response.getOccurredAt() == null ? Instant.now() : response.getOccurredAt();
        part.setStatus(TaskPartStatus.COMPLETED);
        part.setWorkerId(response.getWorkerId());
        part.setAttemptId(response.getAttemptId());
        part.getResults().clear();
        if (response.getCrackedWords() != null) {
            part.getResults().addAll(response.getCrackedWords());
        }
        part.setProcessingError(null);
        part.setUpdatedAt(now);
        part.setCompletedAt(now);
        partRepository.save(part);

        long completedParts = partRepository.countByRequestIdAndStatus(response.getRequestId(), TaskPartStatus.COMPLETED);
        task.setCompletedParts((int) completedParts);
        task.setUpdatedAt(now);

        if (completedParts >= task.getPartCount()) {
            task.setStatus(TaskStatus.READY);
            task.setCompletedAt(now);
            completedRequestsCounter.increment();
            log.info("Request {} completed with {} results", task.getRequestId(), task.getResults().size());
        } else if (TaskStatus.QUEUED.equals(task.getStatus())) {
            task.setStatus(TaskStatus.IN_PROGRESS);
        }

        taskRepository.save(task);
    }

    private void moveTaskToInProgress(String requestId, Instant updatedAt) {
        taskRepository.findById(requestId).ifPresent(task -> {
            if (TaskStatus.QUEUED.equals(task.getStatus())) {
                task.setStatus(TaskStatus.IN_PROGRESS);
                task.setUpdatedAt(updatedAt);
                taskRepository.save(task);
            }
        });
    }

    private WorkerTaskRequest toWorkerTaskRequest(TaskPartDocument part) {
        WorkerTaskRequest request = new WorkerTaskRequest();
        request.setRequestId(part.getRequestId());
        request.setPartNumber(part.getPartNumber());
        request.setPartCount(part.getPartCount());
        request.setHash(part.getHash());
        request.setMaxLength(part.getMaxLength());
        request.setAlphabet(part.getAlphabet());
        return request;
    }

    private String buildPartId(String requestId, int partNumber) {
        return requestId + ":" + partNumber;
    }

    private boolean isExecutionStarted(TaskPartDocument part) {
        return TaskPartStatus.PROCESSING.equals(part.getStatus())
                || TaskPartStatus.COMPLETED.equals(part.getStatus());
    }

    private void validateWorkerResponse(WorkerResponse response) {
        if (response == null) {
            throw new NonRetryableWorkerResponseException("Response body is null");
        }
        if (response.getRequestId() == null || response.getRequestId().isBlank()) {
            throw new NonRetryableWorkerResponseException("Response requestId is blank");
        }
        if (response.getPartNumber() <= 0) {
            throw new NonRetryableWorkerResponseException("Response partNumber is invalid: " + response.getPartNumber());
        }
    }

    private void waitForPublisherConfirm(CorrelationData correlationData) throws Exception {
        CorrelationData.Confirm confirm = correlationData.getFuture().get(5, TimeUnit.SECONDS);
        if (!confirm.isAck()) {
            throw new IllegalStateException("RabbitMQ nack for " + correlationData.getId() + ": " + confirm.getReason());
        }
    }

    private <T> T executeWithMongoRetry(Supplier<T> action) {
        RuntimeException lastException = null;
        for (int attempt = 1; attempt <= 5; attempt += 1) {
            try {
                return action.get();
            } catch (RuntimeException e) {
                if (!isTransientMongoConflict(e)) {
                    throw e;
                }
                lastException = e;
                sleepBeforeRetry(attempt);
            }
        }
        throw lastException;
    }

    private boolean isTransientMongoConflict(Throwable throwable) {
        Throwable current = throwable;
        while (current != null) {
            String message = current.getMessage();
            if (message != null && (message.contains("TransientTransactionError")
                    || message.contains("WriteConflict")
                    || message.contains("Please retry your operation"))) {
                return true;
            }
            current = current.getCause();
        }
        return false;
    }

    private void sleepBeforeRetry(int attempt) {
        try {
            TimeUnit.MILLISECONDS.sleep(25L * attempt);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Interrupted while retrying MongoDB transaction", e);
        }
    }

    private static class NonRetryableWorkerResponseException extends RuntimeException {
        NonRetryableWorkerResponseException(String message) {
            super(message);
        }
    }
}
