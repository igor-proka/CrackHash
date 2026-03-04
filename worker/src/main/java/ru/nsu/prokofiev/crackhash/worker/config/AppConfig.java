package ru.nsu.prokofiev.crackhash.worker.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

@Configuration
public class AppConfig {

    /**
     * Создает бин RestTemplate с поддержкой HTTP метода PATCH.
     * Используется HttpComponentsClientHttpRequestFactory, так как стандартная 
     * библиотека Java (HttpURLConnection) не поддерживает PATCH.
     */
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate(new HttpComponentsClientHttpRequestFactory());
    }
}
