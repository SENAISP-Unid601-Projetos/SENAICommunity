package com.SenaiCommunity.BackEnd.Config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    // Seu interceptor (MANTIDO)
    private final AuthChannelInterceptor authChannelInterceptor;

    public WebSocketConfig(AuthChannelInterceptor authChannelInterceptor) {
        this.authChannelInterceptor = authChannelInterceptor;
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {

        config.enableSimpleBroker("/topic", "/queue")
                // Define o servidor para enviar/esperar pings a cada 20s
                .setHeartbeatValue(new long[]{20000, 20000})
                .setTaskScheduler(heartBeatTaskScheduler());

        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Suas origens (MANTIDAS)
        registry.addEndpoint("/ws")
                .setAllowedOrigins("http://127.0.0.1:5500", "http://127.0.0.1:5501", "http://localhost:3000", "null", "http://127.0.0.1:5502")
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // Seu interceptor (MANTIDO)
        registration.interceptors(authChannelInterceptor);
    }

    // --- INÍCIO DO CÓDIGO ADICIONADO ---

    @Bean
    public ThreadPoolTaskScheduler heartBeatTaskScheduler() {
        ThreadPoolTaskScheduler taskScheduler = new ThreadPoolTaskScheduler();
        taskScheduler.setPoolSize(1);
        taskScheduler.setThreadNamePrefix("wss-heartbeat-scheduler-");
        taskScheduler.initialize();
        return taskScheduler;
    }
}