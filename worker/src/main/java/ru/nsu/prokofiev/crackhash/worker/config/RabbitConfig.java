package ru.nsu.prokofiev.crackhash.worker.config;

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
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * RabbitMQ-конфигурация воркера.
 * Воркер слушает общую durable-очередь задач и публикует ответы в отдельную durable-очередь результатов.
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

    @Value("${spring.rabbitmq.listener.simple.prefetch:1}")
    private int prefetchCount;

    @Bean
    public MessageConverter jsonMessageConverter(ObjectMapper objectMapper) {
        // Формат сообщений должен совпадать с manager: JSON через Jackson.
        return new Jackson2JsonMessageConverter(objectMapper);
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory, MessageConverter jsonMessageConverter) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter);
        // mandatory=true позволяет заметить неправильную маршрутизацию результата.
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
        // Ack отправляется вручную только после успешной публикации результата.
        factory.setAcknowledgeMode(org.springframework.amqp.core.AcknowledgeMode.MANUAL);
        factory.setDefaultRequeueRejected(false);
        // Обычно держим 1 задачу на воркера, чтобы при падении терять минимум уже выданной работы.
        factory.setPrefetchCount(prefetchCount);
        return factory;
    }

    @Bean
    public DirectExchange tasksExchange() {
        return ExchangeBuilder.directExchange(tasksExchangeName).durable(true).build();
    }

    @Bean
    public Queue tasksQueue() {
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
        return ExchangeBuilder.directExchange(resultsExchangeName).durable(true).build();
    }

    @Bean
    public Queue resultsQueue() {
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
