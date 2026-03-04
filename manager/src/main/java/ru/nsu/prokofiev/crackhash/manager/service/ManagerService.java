package ru.nsu.prokofiev.crackhash.manager.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import ru.nsu.prokofiev.crackhash.manager.model.CrackRequest;
import ru.nsu.prokofiev.crackhash.manager.model.StatusResponse;
import ru.nsu.prokofiev.crackhash.manager.model.TaskState;
import ru.nsu.prokofiev.crackhash.manager.model.WorkerResponse;
import ru.nsu.prokofiev.crackhash.manager.model.WorkerTaskRequest;
import ru.nsu.prokofiev.crackhash.manager.repository.TaskRepository;

import javax.annotation.PostConstruct;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/**
 * Сервис управления задачами CrackHash на стороне Менеджера.
 * Отвечает за создание задач, их распределение между воркерами и сбор результатов.
 */
@Slf4j
@Service
public class ManagerService {

    private final TaskRepository taskRepository;
    private final RestTemplate restTemplate;

    @Value("${worker.urls:http://worker-1:8081,http://worker-2:8081,http://worker-3:8081}")
    private String workerUrlsRaw;

    @Value("${task.timeout.ms:300000}")
    private long taskTimeoutMs;

    private List<String> workerUrls;

    public ManagerService(TaskRepository taskRepository, RestTemplate restTemplate) {
        this.taskRepository = taskRepository;
        this.restTemplate = restTemplate;
    }

    @PostConstruct
    public void init() {
        workerUrls = Arrays.asList(workerUrlsRaw.split(","));
        log.info("Configured {} workers: {}", workerUrls.size(), workerUrls);
    }

    /**
     * Создает новую задачу на взлом хэша.
     * Регистрирует задачу в локальном репозитории и запускает асинхронную рассылку по воркерам.
     */
    public String createCrackTask(CrackRequest request) {
        String requestId = UUID.randomUUID().toString();

        TaskState state = new TaskState();
        state.setRequestId(requestId);
        state.setHash(request.getHash());
        state.setMaxLength(request.getMaxLength());
        state.setCreationTime(System.currentTimeMillis());
        state.setStatus("IN_PROGRESS");
        state.setPendingParts(workerUrls.size());

        // Сохраняем начальное состояние задачи (в ConcurrentHashMap)
        taskRepository.save(state);

        // Запускаем рассылку тасок воркерам в отдельном потоке, чтобы сразу вернуть requestId клиенту
        new Thread(() -> dispatchTasks(state)).start();

        return requestId;
    }

    /**
     * Разделяет задачу на части и отправляет каждую конкретному воркеру.
     */
    private void dispatchTasks(TaskState state) {
        int partCount = workerUrls.size();

        for (int i = 0; i < partCount; i++) {
            String targetUrl = workerUrls.get(i).trim();

            WorkerTaskRequest taskRequest = new WorkerTaskRequest();
            taskRequest.setRequestId(state.getRequestId());
            taskRequest.setPartNumber(i + 1); // Порядковый номер части
            taskRequest.setPartCount(partCount);
            taskRequest.setHash(state.getHash());
            taskRequest.setMaxLength(state.getMaxLength());

            try {
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                HttpEntity<WorkerTaskRequest> request = new HttpEntity<>(taskRequest, headers);

                // Отправляем задачу воркеру по HTTP POST
                restTemplate.postForObject(targetUrl + "/internal/api/worker/hash/crack/task", request, Void.class);
                log.info("Dispatched part {}/{} to {}", i + 1, partCount, targetUrl);
            } catch (Exception e) {
                log.error("Failed to send task part {} to {}: {}", i + 1, targetUrl, e.getMessage());
            }
        }
    }

    public StatusResponse getTaskStatus(String requestId) {
        TaskState state = taskRepository.findById(requestId);
        if (state == null) {
            return new StatusResponse("ERROR", null);
        }
        return new StatusResponse(state.getStatus(), state.getResults());
    }

    /**
     * Обрабатывает ответ от воркера.
     * Агрегирует найденные слова и проверяет, все ли части задачи выполнены.
     */
    public void processWorkerResponse(WorkerResponse response) {
        TaskState state = taskRepository.findById(response.getRequestId());
        if (state == null) {
            log.warn("Received response for unknown request: {}", response.getRequestId());
            return;
        }
        if (!state.getStatus().equals("IN_PROGRESS")) {
            log.warn("Received response for non-active request: {}", response.getRequestId());
            return;
        }

        // Синхронизируемся на объекте задачи, чтобы избежать Race Condition при обновлении счетчика
        synchronized (state) {
            if (response.getCrackedWords() != null) {
                state.getResults().addAll(response.getCrackedWords());
            }
            int received = state.getReceivedParts().incrementAndGet();
            log.info("Request {}: received part {}/{}", response.getRequestId(), received, state.getPendingParts());

            // Если все воркеры отчитались — переводим задачу в READY
            if (received >= state.getPendingParts()) {
                state.setStatus("READY");
                log.info("Request {} completed with {} results", response.getRequestId(), state.getResults().size());
            }
            taskRepository.save(state);
        }
    }

    /**
     * Периодическая проверка задач на таймаут.
     */
    @Scheduled(fixedRate = 10000)
    public void checkTimeouts() {
        long now = System.currentTimeMillis();
        for (TaskState state : taskRepository.findAll()) {
            if (state.getStatus().equals("IN_PROGRESS") && (now - state.getCreationTime() > taskTimeoutMs)) {
                synchronized (state) {
                    if (state.getStatus().equals("IN_PROGRESS")) {
                        state.setStatus("ERROR");
                        taskRepository.save(state);
                        log.warn("Task {} timed out", state.getRequestId());
                    }
                }
            }
        }
    }
}
