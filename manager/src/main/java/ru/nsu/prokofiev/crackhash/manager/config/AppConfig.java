package ru.nsu.prokofiev.crackhash.manager.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class AppConfig {

    /**
     * Создает бин RestTemplate для выполнения HTTP-запросов к воркерам.
     */
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}
