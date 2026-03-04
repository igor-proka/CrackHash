package ru.nsu.prokofiev.crackhash.worker.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;
import ru.nsu.prokofiev.crackhash.worker.model.WorkerResponse;
import ru.nsu.prokofiev.crackhash.worker.model.WorkerTaskRequest;
import ru.nsu.prokofiev.crackhash.worker.service.HashCracker;

import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Slf4j
@RestController
@RequestMapping("/internal/api/worker/hash/crack")
@RequiredArgsConstructor
public class WorkerApi {

    private final HashCracker hashCracker;
    private final RestTemplate restTemplate;
    private final ExecutorService executorService = Executors.newFixedThreadPool(4);

    @Value("${manager.url:http://manager:8080}")
    private String managerUrl;

    @PostMapping("/task")
    public ResponseEntity<Void> receiveTask(@RequestBody WorkerTaskRequest request) {
        log.info("Received task #{} for request {}", request.getPartNumber(), request.getRequestId());

        executorService.submit(() -> {
            List<String> results = hashCracker.crack(request);

            WorkerResponse response = new WorkerResponse();
            response.setRequestId(request.getRequestId());
            response.setPartNumber(request.getPartNumber());
            response.setCrackedWords(results);

            try {
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                HttpEntity<WorkerResponse> entity = new HttpEntity<>(response, headers);

                restTemplate.exchange(
                        managerUrl + "/internal/api/manager/hash/crack/request",
                        HttpMethod.PATCH,
                        entity,
                        Void.class
                );
                log.info("Sent response for task #{} back to manager, found {} words",
                        request.getPartNumber(), results.size());
            } catch (Exception e) {
                log.error("Failed to send response back to manager: {}", e.getMessage(), e);
            }
        });

        return ResponseEntity.ok().build();
    }
}
