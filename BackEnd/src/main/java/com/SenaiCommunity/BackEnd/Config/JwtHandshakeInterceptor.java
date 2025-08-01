package com.SenaiCommunity.BackEnd.Config;

import com.SenaiCommunity.BackEnd.Security.JWTUtil;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.http.server.ServletServerHttpResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@Component
public class JwtHandshakeInterceptor implements HandshakeInterceptor {

    @Autowired
    private JWTUtil jwtUtil;

    @Override
    public boolean beforeHandshake(ServerHttpRequest request,
                                   ServerHttpResponse response,
                                   WebSocketHandler wsHandler,
                                   Map<String, Object> attributes) throws Exception {
        String token = null;

        // 1. Se for uma requisição do SockJS, extrair o parâmetro da URL
        if (request instanceof ServletServerHttpRequest servletRequest) {
            HttpServletRequest req = servletRequest.getServletRequest();
            token = req.getParameter("token");
        }

        // 2. Tentar pegar dos headers (para casos de WebSocket puro)
        if ((token == null || token.isEmpty()) && request.getHeaders().containsKey("Authorization")) {
            List<String> authHeaders = request.getHeaders().get("Authorization");
            if (authHeaders != null && !authHeaders.isEmpty()) {
                token = authHeaders.get(0).replace("Bearer ", "");
            }
        }

        // 3. Validar token e extrair claims
        try {
            if (token != null) {
                Claims claims = jwtUtil.getClaims(token);
                String username = claims.getSubject();
                Long userId = claims.get("id", Long.class);

                attributes.put("username", username);
                attributes.put("id", userId);
                return true;
            }
        } catch (Exception e) {
            System.out.println("Erro ao validar token no WebSocket: " + e.getMessage());
        }

        response.setStatusCode(HttpStatus.UNAUTHORIZED);
        return false;
    }


    @Override
    public void afterHandshake(ServerHttpRequest request,
                               ServerHttpResponse response,
                               WebSocketHandler wsHandler,
                               Exception exception) {
        // opcional
    }

    private String extrairToken(HttpServletRequest request) {
        // 1. Header padrão Authorization: Bearer xxx.yyy.zzz
        String bearerToken = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }

        // 2. Query string (ws://.../ws-chat?token=...)
        String query = request.getQueryString();
        if (query != null && query.contains("token=")) {
            for (String param : query.split("&")) {
                if (param.startsWith("token=")) {
                    return param.substring(6);
                }
            }
        }
        return null;
    }
}
