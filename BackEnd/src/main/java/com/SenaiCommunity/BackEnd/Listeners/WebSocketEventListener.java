package com.SenaiCommunity.BackEnd.Listeners;

import com.SenaiCommunity.BackEnd.Service.UserStatusService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import java.security.Principal; // Importar Principal

@Component
public class WebSocketEventListener {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketEventListener.class);

    @Autowired
    private UserStatusService userStatusService;

    @Autowired
    private SimpMessageSendingOperations messagingTemplate;

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        Principal userPrincipal = headerAccessor.getUser();

        if (userPrincipal != null && userPrincipal.getName() != null) {
            String username = userPrincipal.getName();
            logger.info("Usuário conectado: {}", username);
            userStatusService.addUser(username);

            // 1. Notifica TODOS os clientes (incluindo o novo) sobre a lista atualizada
            messagingTemplate.convertAndSend("/topic/status", userStatusService.getOnlineUsers());
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        Principal userPrincipal = headerAccessor.getUser();

        if (userPrincipal != null && userPrincipal.getName() != null) {
            String username = userPrincipal.getName();
            logger.info("Usuário desconectado: {}", username);
            userStatusService.removeUser(username);

            // Notifica todos os clientes restantes sobre a mudança na lista
            messagingTemplate.convertAndSend("/topic/status", userStatusService.getOnlineUsers());
        }
    }
}