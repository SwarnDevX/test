package dev.codecrafter.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    @Value("${app.rabbitmq.submission-exchange}")
    private String submissionExchange;

    @Value("${app.rabbitmq.submission-queue}")
    private String submissionQueue;

    @Value("${app.rabbitmq.submission-routing-key}")
    private String submissionRoutingKey;

    @Value("${app.rabbitmq.verdict-queue}")
    private String verdictQueue;

    @Bean
    DirectExchange submissionExchange() {
        return new DirectExchange(submissionExchange, true, false);
    }

    @Bean
    Queue submissionQueue() {
        return QueueBuilder.durable(submissionQueue).build();
    }

    @Bean
    Queue verdictQueue() {
        return QueueBuilder.durable(verdictQueue).build();
    }

    @Bean
    Binding submissionBinding() {
        return BindingBuilder.bind(submissionQueue())
            .to(submissionExchange())
            .with(submissionRoutingKey);
    }

    @Bean
    MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    RabbitTemplate rabbitTemplate(ConnectionFactory cf) {
        RabbitTemplate template = new RabbitTemplate(cf);
        template.setMessageConverter(jsonMessageConverter());
        return template;
    }

    @Bean
    SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(ConnectionFactory cf) {
        SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        factory.setConnectionFactory(cf);
        factory.setMessageConverter(jsonMessageConverter());
        factory.setAcknowledgeMode(AcknowledgeMode.AUTO);
        return factory;
    }
}
