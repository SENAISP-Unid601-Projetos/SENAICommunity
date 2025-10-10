package com.SenaiCommunity.BackEnd.Service;

import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class UserStatusService {

    // Usamos um Set thread-safe para armazenar os e-mails dos usuários online.
    private final Set<String> onlineUsers = ConcurrentHashMap.newKeySet();

    /**
     * Adiciona um usuário à lista de online.
     */
    public void addUser(String userEmail) {
        onlineUsers.add(userEmail);
    }

    /**
     * Remove um usuário da lista de online.
     */
    public void removeUser(String userEmail) {
        onlineUsers.remove(userEmail);
    }

    /**
     * Verifica se um usuário específico está online.
     */
    public boolean isOnline(String userEmail) {
        return onlineUsers.contains(userEmail);
    }

    /**
     * Retorna o conjunto de todos os usuários online.
     */
    public Set<String> getOnlineUsers() {
        return onlineUsers;
    }
}