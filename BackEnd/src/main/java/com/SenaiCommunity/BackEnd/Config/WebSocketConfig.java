package com.SenaiCommunity.BackEnd.Config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    private final AuthChannelInterceptor authChannelInterceptor;

    public WebSocketConfig(AuthChannelInterceptor authChannelInterceptor) {
        this.authChannelInterceptor = authChannelInterceptor;
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic", "/queue");
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // CORREÇÃO: Unificamos a lista de origens para evitar que uma sobrescreva a outra.
        // Incluído 'http://localhost:5173' (seu frontend provável) e 'null' (para SockJS)
        registry.addEndpoint("/ws")
                .setAllowedOrigins(
                        "http://127.0.0.1:5500",
                        "http://127.0.0.1:5501",
                        "http://127.0.0.1:5502",
                        "http://localhost:3000",
                        "http://localhost:5500",
                        "http://localhost:5173",
                        "null"
                )
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(authChannelInterceptor);
    }
}