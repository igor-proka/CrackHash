package ru.nsu.prokofiev.crackhash.manager.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.ExchangeBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Описывает RabbitMQ-инфраструктуру менеджера.
 * Здесь создаются durable direct exchange/queue для задач и результатов,
 * а также включается ручной ack, чтобы сообщения не терялись при падении сервисов.
 */
@Configuration
public class RabbitConfig {

    @Value("${crackhash.rabbitmq.tasks-exchange}")
    private String tasksExchangeName;

    @Value("${crackhash.rabbitmq.tasks-queue}")
    private String tasksQueueName;

    @Value("${crackhash.rabbitmq.tasks-routing-key}")
    private String tasksRoutingKey;

    @Value("${crackhash.rabbitmq.results-exchange}")
    private String resultsExchangeName;

    @Value("${crackhash.rabbitmq.results-queue}")
    private String resultsQueueName;

    @Value("${crackhash.rabbitmq.results-routing-key}")
    private String resultsRoutingKey;

    @Bean
    public MessageConverter jsonMessageConverter(ObjectMapper objectMapper) {
        // Внутренние сообщения manager/worker сериализуются в JSON.
        return new Jackson2JsonMessageConverter(objectMapper);
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory, MessageConverter jsonMessageConverter) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter);
        // mandatory=true помогает получать ошибку, если routing key не привел сообщение ни в одну очередь.
        template.setMandatory(true);
        return template;
    }

    @Bean
    public SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(
            ConnectionFactory connectionFactory,
            MessageConverter jsonMessageConverter
    ) {
        SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        factory.setConnectionFactory(connectionFactory);
        factory.setMessageConverter(jsonMessageConverter);
        // Listener сам подтверждает сообщение только после успешной записи результата в MongoDB.
        factory.setAcknowledgeMode(org.springframework.amqp.core.AcknowledgeMode.MANUAL);
        factory.setDefaultRequeueRejected(false);
        return factory;
    }

    @Bean
    public DirectExchange tasksExchange() {
        // Durable exchange переживает рестарт RabbitMQ.
        return ExchangeBuilder.directExchange(tasksExchangeName).durable(true).build();
    }

    @Bean
    public Queue tasksQueue() {
        // Очередь задач хранит сообщения до появления свободного воркера.
        return QueueBuilder.durable(tasksQueueName).build();
    }

    @Bean
    public Binding tasksBinding(
            @Qualifier("tasksExchange") DirectExchange tasksExchange,
            @Qualifier("tasksQueue") Queue tasksQueue
    ) {
        return BindingBuilder.bind(tasksQueue).to(tasksExchange).with(tasksRoutingKey);
    }

    @Bean
    public DirectExchange resultsExchange() {
        // Отдельный exchange для ответов воркеров нужен, чтобы manager мог падать независимо от воркеров.
        return ExchangeBuilder.directExchange(resultsExchangeName).durable(true).build();
    }

    @Bean
    public Queue resultsQueue() {
        // Очередь результатов сохраняет ответы, если manager временно недоступен.
        return QueueBuilder.durable(resultsQueueName).build();
    }

    @Bean
    public Binding resultsBinding(
            @Qualifier("resultsExchange") DirectExchange resultsExchange,
            @Qualifier("resultsQueue") Queue resultsQueue
    ) {
        return BindingBuilder.bind(resultsQueue).to(resultsExchange).with(resultsRoutingKey);
    }
}
