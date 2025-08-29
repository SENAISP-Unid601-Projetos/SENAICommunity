package com.SenaiCommunity.BackEnd.Config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.SimpMessageType;
import org.springframework.security.config.annotation.web.messaging.MessageSecurityMetadataSourceRegistry;
import org.springframework.security.config.annotation.web.socket.AbstractSecurityWebSocketMessageBrokerConfigurer;

@Configuration
public class WebSocketSecurityConfig extends AbstractSecurityWebSocketMessageBrokerConfigurer {

    @Override
    protected void configureInbound(MessageSecurityMetadataSourceRegistry messages) {
        messages
                .simpTypeMatchers(SimpMessageType.CONNECT).permitAll() // Permite a conexão, pois o handshake já foi validado
                .simpDestMatchers("/app/**").authenticated() // Protege o envio de mensagens
                .anyMessage().authenticated(); // Protege outras ações como SUBSCRIBE
    }

    @Override
    protected boolean sameOriginDisabled() {
        return true;
    }
}
