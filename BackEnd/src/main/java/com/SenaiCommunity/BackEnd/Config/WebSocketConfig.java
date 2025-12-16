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
        registry.addEndpoint("/ws")
                
                .setAllowedOrigins(
                        "http://127.0.0.1:5501", 
                        "http://localhost:5500", 
                        "http://localhost:3000", 
                        "null", 
                        "http://127.0.0.1:5502",
                        "https://senaicommunity.up.railway.app",
                        "https://senaicommunitydeploy-production.up.railway.app",
                        "https://senai-community-front.vercel.app",
                        "https://senaicommunitydeploy.up.railway.app", 
                        "https://senaicommunityfront.vercel.app",
                        "https://senaicommunityapp.up.railway.app"
                )
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(authChannelInterceptor);
    }
}