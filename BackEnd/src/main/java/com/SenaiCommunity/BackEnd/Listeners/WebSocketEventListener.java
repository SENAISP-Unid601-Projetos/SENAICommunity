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
        String username = headerAccessor.getUser().getName(); // Pega o email

        if(username != null) {
            logger.info("Usuário conectado: {}", username);
            userStatusService.addUser(username);

            // Notifica todos os clientes sobre a nova lista de usuários online
            messagingTemplate.convertAndSend("/topic/status", userStatusService.getOnlineUsers());
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String username = headerAccessor.getUser().getName(); // Pega o email

        if(username != null) {
            logger.info("Usuário desconectado: {}", username);
            userStatusService.removeUser(username);

            // Notifica todos os clientes sobre a nova lista de usuários online
            messagingTemplate.convertAndSend("/topic/status", userStatusService.getOnlineUsers());
        }
    }
}