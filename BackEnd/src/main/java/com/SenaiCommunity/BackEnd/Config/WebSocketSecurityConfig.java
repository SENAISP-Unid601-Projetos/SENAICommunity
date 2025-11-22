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
                // ✅ ADICIONE DISCONNECT e UNSUBSCRIBE AQUI
                .simpTypeMatchers(
                        SimpMessageType.CONNECT,
                        SimpMessageType.DISCONNECT,
                        SimpMessageType.UNSUBSCRIBE,
                        SimpMessageType.HEARTBEAT
                ).permitAll()
                .simpDestMatchers("/app/**").authenticated()
                .simpDestMatchers("/user/**", "/topic/**", "/queue/**").authenticated() // É bom proteger as subscrições também
                .anyMessage().authenticated();
    }

    @Override
    protected boolean sameOriginDisabled() {
        return true;
    }
}