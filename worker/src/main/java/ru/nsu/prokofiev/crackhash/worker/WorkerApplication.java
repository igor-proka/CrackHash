package ru.nsu.prokofiev.crackhash.worker;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.amqp.rabbit.annotation.EnableRabbit;

/**
 * Точка входа сервиса Worker.
 * Воркер не имеет публичного API для задач: он слушает RabbitMQ и отдает результаты обратно в очередь.
 */
@SpringBootApplication
@EnableRabbit
public class WorkerApplication {
    public static void main(String[] args) {
        SpringApplication.run(WorkerApplication.class, args);
    }
}
