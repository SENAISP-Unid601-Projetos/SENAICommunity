package com.SenaiCommunity.BackEnd.Config;

import com.SenaiCommunity.BackEnd.Security.JWTUtil;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Collections;
import java.util.Map;

@Component
public abstract class JwtHandshakeInterceptor implements HandshakeInterceptor {

    @Autowired
    private JWTUtil jwtUtil;

    public boolean beforeHandshake(HttpServletRequest request,
                                   HttpServletResponse response,
                                   WebSocketHandler wsHandler,
                                   Map<String, Object> attributes) throws Exception {

        String token = extrairToken(request);

        if (token != null) {
            Claims claims = jwtUtil.getClaims(token);

            if (claims != null) {
                String username = claims.getSubject();
                String role = claims.get("role", String.class);

                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(username, null,
                                Collections.singletonList(() -> role));

                SecurityContextHolder.getContext().setAuthentication(auth);

                attributes.put("user", username); // disponível em controllers se quiser
                return true;
            }
        }

        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        return false;
    }

    public void afterHandshake(HttpServletRequest request,
                               HttpServletResponse response,
                               WebSocketHandler wsHandler,
                               Exception exception) {
        // Não é necessário implementar
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
