package ru.nsu.prokofiev.crackhash.worker.service;

import com.rabbitmq.client.Channel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.MessageDeliveryMode;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.connection.CorrelationData;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.AmqpHeaders;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;
import ru.nsu.prokofiev.crackhash.worker.model.WorkerEventType;
import ru.nsu.prokofiev.crackhash.worker.model.WorkerResponse;
import ru.nsu.prokofiev.crackhash.worker.model.WorkerTaskRequest;

import java.io.IOException;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Slf4j
@Component
@RequiredArgsConstructor
public class WorkerTaskListener {

    private final HashCracker hashCracker;
    private final RabbitTemplate rabbitTemplate;
    private final String workerId = resolveWorkerId();

    @Value("${crackhash.rabbitmq.results-exchange}")
    private String resultsExchange;

    @Value("${crackhash.rabbitmq.results-routing-key}")
    private String resultsRoutingKey;

    @RabbitListener(queues = "${crackhash.rabbitmq.tasks-queue}")
    public void receiveTask(
            WorkerTaskRequest request,
            Channel channel,
            @Header(AmqpHeaders.DELIVERY_TAG) long deliveryTag
    ) throws IOException {
        String attemptId = UUID.randomUUID().toString();

        try {
            log.info("Received task part {}/{} for request {}",
                    request.getPartNumber(), request.getPartCount(), request.getRequestId());
            publishEvent(buildEvent(request, WorkerEventType.STARTED, attemptId, null, null));
        } catch (Exception e) {
            log.error("Failed to publish STARTED event for request {} part {}",
                    request == null ? null : request.getRequestId(),
                    request == null ? null : request.getPartNumber(), e);
            channel.basicNack(deliveryTag, false, true);
            return;
        }

        List<String> results;
        try {
            results = hashCracker.crack(request);
        } catch (Exception e) {
            log.error("Failed to crack task part {} for request {}",
                    request.getPartNumber(), request.getRequestId(), e);
            try {
                publishEvent(buildEvent(request, WorkerEventType.FAILED, attemptId, null, e.getMessage()));
                channel.basicAck(deliveryTag, false);
            } catch (Exception eventError) {
                log.warn("Failed to publish failure event for request {} part {}: {}",
                        request.getRequestId(), request.getPartNumber(), eventError.getMessage());
                channel.basicNack(deliveryTag, false, true);
            }
            return;
        }

        try {
            publishEvent(buildEvent(request, WorkerEventType.COMPLETED, attemptId, results, null));
            channel.basicAck(deliveryTag, false);
            log.info("Sent result for request {} part {}, found {} words",
                    request.getRequestId(), request.getPartNumber(), results.size());
        } catch (Exception e) {
            log.error("Failed to publish COMPLETED event for request {} part {}",
                    request.getRequestId(), request.getPartNumber(), e);
            channel.basicNack(deliveryTag, false, true);
        }
    }

    private void publishEvent(WorkerResponse response) {
        String id = response.getRequestId() + ":" + response.getPartNumber()
                + ":" + response.getAttemptId() + ":" + response.getEventType();
        CorrelationData correlationData = new CorrelationData(id);
        rabbitTemplate.convertAndSend(resultsExchange, resultsRoutingKey, response, message -> {
            message.getMessageProperties().setDeliveryMode(MessageDeliveryMode.PERSISTENT);
            message.getMessageProperties().setMessageId(id);
            message.getMessageProperties().setCorrelationId(id);
            return message;
        }, correlationData);

        try {
            CorrelationData.Confirm confirm = correlationData.getFuture().get(5, TimeUnit.SECONDS);
            if (!confirm.isAck()) {
                throw new IllegalStateException("RabbitMQ nack for " + id + ": " + confirm.getReason());
            }
        } catch (Exception e) {
            throw new IllegalStateException("RabbitMQ confirm failed for " + id, e);
        }
    }

    private WorkerResponse buildEvent(
            WorkerTaskRequest request,
            String eventType,
            String attemptId,
            List<String> crackedWords,
            String errorMessage
    ) {
        WorkerResponse response = new WorkerResponse();
        response.setEventType(eventType);
        response.setRequestId(request.getRequestId());
        response.setPartNumber(request.getPartNumber());
        response.setWorkerId(workerId);
        response.setAttemptId(attemptId);
        response.setOccurredAt(Instant.now());
        response.setCrackedWords(crackedWords);
        response.setErrorMessage(errorMessage);
        return response;
    }

    private static String resolveWorkerId() {
        String explicitWorkerId = System.getenv("WORKER_ID");
        if (explicitWorkerId != null && !explicitWorkerId.isBlank()) {
            return explicitWorkerId;
        }

        String dockerHostname = System.getenv("HOSTNAME");
        if (dockerHostname != null && !dockerHostname.isBlank()) {
            return dockerHostname;
        }

        try {
            return InetAddress.getLocalHost().getHostName();
        } catch (UnknownHostException e) {
            return "worker-" + UUID.randomUUID();
        }
    }
}
