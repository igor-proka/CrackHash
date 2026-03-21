package ru.nsu.prokofiev.crackhash.loadtest;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Нагрузочный тест для системы CrackHash.
 *
 * Создает заданное количество виртуальных клиентов, которые одновременно
 * отправляют POST-запросы на эндпоинт /api/hash/crack Менеджера.
 *
 * Цель — найти точку деградации системы: исчерпание пула потоков Tomcat,
 * OOM у воркеров из-за бесконечной очереди ExecutorService,
 * рост задержки и отказы на уровне TCP-сокетов.
 */
public class LoadTest {

    // MD5 хэш от слова "test" — простой тестовый payload
    private static final String TARGET_HASH = "098f6bcd4621d373cade4e832627b4f6";
    private static final int MAX_LENGTH = 4;

    // URL менеджера по умолчанию
    private static final String DEFAULT_URL = "http://localhost:8082/api/hash/crack";

    // Таймаут на один HTTP-запрос (10 секунд)
    private static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(10);

    public static void main(String[] args) {
        // Разбор аргументов командной строки
        int clients = 1000; // кол-во клиентов по умолчанию
        String targetUrl = DEFAULT_URL;

        if (args.length >= 1) {
            clients = Integer.parseInt(args[0]);
        }
        if (args.length >= 2) {
            targetUrl = args[1];
        }

        // Делаем effectively final для использования в лямбдах
        final int clientCount = clients;
        final String url = targetUrl;

        System.out.println("=== CrackHash Load Test ===");
        System.out.println("Clients: " + clientCount);
        System.out.println("URL: " + url);
        System.out.println();

        // Создаем HTTP-клиент (Java 11 встроенный) без ограничений на кол-во соединений
        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(REQUEST_TIMEOUT)
                .build();

        // JSON-тело запроса на взлом хэша
        String jsonBody = "{\"hash\":\"" + TARGET_HASH + "\",\"maxLength\":" + MAX_LENGTH + "}";

        // Статистика результатов
        ConcurrentHashMap<String, AtomicInteger> resultCounters = new ConcurrentHashMap<>();
        AtomicLong totalLatencyMs = new AtomicLong(0);

        // Создаем список CompletableFuture — каждый "клиент" отправляет один запрос
        List<CompletableFuture<Void>> futures = new ArrayList<>();

        long startTime = System.currentTimeMillis();

        for (int i = 0; i < clientCount; i++) {
            final int clientId = i + 1;

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json")
                    .timeout(REQUEST_TIMEOUT)
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();

            // Отправляем запрос асинхронно через CompletableFuture
            CompletableFuture<Void> future = httpClient
                    .sendAsync(request, HttpResponse.BodyHandlers.ofString())
                    .thenAccept(response -> {
                        long latency = System.currentTimeMillis() - startTime;
                        totalLatencyMs.addAndGet(latency);

                        int statusCode = response.statusCode();
                        if (statusCode == 200) {
                            // Успешный ответ — менеджер принял запрос и вернул requestId
                            increment(resultCounters, "SUCCESS (200)");
                            if (clientId <= 10 || clientId % 100 == 0) {
                                // Логируем первые 10 и каждый сотый результат
                                System.out.printf("[Клиент %04d] УСПЕХ: %s (задержка %d мс)%n",
                                        clientId, response.body().substring(0, Math.min(60, response.body().length())), latency);
                            }
                        } else {
                            // HTTP ошибка — сервер перегружен (5xx) или иная причина
                            String key = "HTTP_" + statusCode;
                            increment(resultCounters, key);
                            System.out.printf("[Клиент %04d] HTTP ОШИБКА %d: %s%n",
                                    clientId, statusCode, response.body().substring(0, Math.min(100, response.body().length())));
                        }
                    })
                    .exceptionally(ex -> {
                        // Исключение — Connection Refused, Timeout и т.д.
                        String cause = classifyException(ex);
                        increment(resultCounters, cause);
                        System.out.printf("[Клиент %04d] ОШИБКА: %s%n", clientId, cause);
                        return null;
                    });

            futures.add(future);
        }

        // Дожидаемся завершения всех запросов
        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();

        long totalTime = System.currentTimeMillis() - startTime;

        // === Вывод итоговой статистики ===
        System.out.println();
        System.out.println("==================================================");
        System.out.println("=== LOAD TEST RESULTS ===");
        System.out.println("==================================================");
        System.out.printf("Total time: %.2f sec%n", totalTime / 1000.0);
        System.out.printf("Total requests: %d%n", clientCount);
        System.out.printf("RPS: %.2f%n", clientCount / (totalTime / 1000.0));
        System.out.println("--------------------------------------------------");
        System.out.println("Results:");

        // Сортируем по убыванию количества
        final int total = clientCount;
        resultCounters.entrySet().stream()
                .sorted((a, b) -> b.getValue().get() - a.getValue().get())
                .forEach(entry -> {
                    int count = entry.getValue().get();
                    double pct = (count * 100.0) / total;
                    System.out.printf("  %-30s : %5d (%.1f%%)%n", entry.getKey(), count, pct);
                });

        System.out.println("==================================================");
    }

    /**
     * Классифицирует исключение по типу для удобства анализа.
     */
    private static String classifyException(Throwable ex) {
        Throwable cause = ex.getCause() != null ? ex.getCause() : ex;
        String msg = cause.getClass().getSimpleName() + ": " + cause.getMessage();

        if (msg.contains("ConnectException") || msg.contains("Connection refused")) {
            // Tomcat перестал принимать подключения — исчерпан backlog
            return "CONNECTION_REFUSED (Tomcat перегружен)";
        } else if (msg.contains("HttpTimeoutException") || msg.contains("timed out")) {
            // Запрос не обработан за отведённое время
            return "TIMEOUT (сервер не успел ответить)";
        } else if (msg.contains("IOException") || msg.contains("reset")) {
            // Соединение разорвано сервером
            return "CONNECTION_RESET (соединение разорвано)";
        } else {
            return "EXCEPTION: " + msg;
        }
    }

    /**
     * Потокобезопасный инкремент счетчика в ConcurrentHashMap.
     */
    private static void increment(ConcurrentHashMap<String, AtomicInteger> map, String key) {
        map.computeIfAbsent(key, k -> new AtomicInteger(0)).incrementAndGet();
    }
}
