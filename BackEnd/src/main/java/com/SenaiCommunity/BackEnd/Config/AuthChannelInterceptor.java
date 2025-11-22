package com.SenaiCommunity.BackEnd.Config;

import com.SenaiCommunity.BackEnd.Security.JWTUtil;
import com.SenaiCommunity.BackEnd.Service.UsuarioDetailsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 99)
public class AuthChannelInterceptor implements ChannelInterceptor {

    private final JWTUtil jwtUtil;
    private final UsuarioDetailsService userDetailsService;

    @Autowired
    public AuthChannelInterceptor(@Lazy JWTUtil jwtUtil, @Lazy UsuarioDetailsService userDetailsService) {
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        final StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            List<String> authorization = accessor.getNativeHeader("Authorization");

            if (authorization != null && !authorization.isEmpty()) {
                String authHeader = authorization.get(0);
                if (authHeader != null && authHeader.startsWith("Bearer ")) {
                    String token = authHeader.substring(7);

                    // ✅ MUDANÇA AQUI: Try-Catch para evitar UsernameNotFoundException travar o socket
                    try {
                        if (jwtUtil.validarToken(token)) {
                            String email = jwtUtil.getEmailDoToken(token);
                            UserDetails userDetails = userDetailsService.loadUserByUsername(email);
                            UsernamePasswordAuthenticationToken authentication =
                                    new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                            accessor.setUser(authentication);
                        }
                    } catch (Exception e) {
                        // Loga o erro mas não quebra a execução.
                        // O usuário ficará como 'null' e o WebSocketSecurityConfig vai rejeitar a conexão graciosamente se necessário.
                        System.out.println("Erro na autenticação do WebSocket: " + e.getMessage());
                    }
                }
            }
        }

        if (accessor != null && accessor.getUser() instanceof Authentication) {
            SecurityContextHolder.getContext().setAuthentication((Authentication) accessor.getUser());
        }

        return message;
    }
}