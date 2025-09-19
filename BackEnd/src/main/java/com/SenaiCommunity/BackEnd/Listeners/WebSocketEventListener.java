package com.SenaiCommunity.BackEnd.Listeners;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.HashSet;
import java.util.Set;

@Component
public class WebSocketEventListener {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketEventListener.class);

    // Usamos um Set para armazenar os emails dos usuários online
    private final Set<String> usuariosOnline = new HashSet<>();

    @Autowired
    private SimpMessageSendingOperations messagingTemplate;

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String username = headerAccessor.getUser().getName(); // Pega o email do usuário autenticado

        if(username != null) {
            logger.info("Usuário conectado: " + username);
            usuariosOnline.add(username);

            // Informa a todos os clientes sobre o novo status
            // O frontend deve estar inscrito em "/topic/status"
            messagingTemplate.convertAndSend("/topic/status", usuariosOnline);
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String username = headerAccessor.getUser().getName(); // Pega o email do usuário que desconectou

        if(username != null) {
            logger.info("Usuário desconectado: " + username);
            usuariosOnline.remove(username);

            // Informa a todos os clientes sobre a saída do usuário
            messagingTemplate.convertAndSend("/topic/status", usuariosOnline);
        }
    }
}