package ru.nsu.prokofiev.crackhash.manager;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.amqp.rabbit.annotation.EnableRabbit;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.transaction.annotation.EnableTransactionManagement;

/**
 * Точка входа сервиса Manager.
 * Включает REST API, RabbitMQ-listener, MongoDB-транзакции и scheduler для outbox-публикации.
 */
@SpringBootApplication
@EnableRabbit
@EnableScheduling // Включает outbox-планировщик для повторной публикации задач в RabbitMQ.
@EnableTransactionManagement
public class ManagerApplication {
    public static void main(String[] args) {
        SpringApplication.run(ManagerApplication.class, args);
    }
}
