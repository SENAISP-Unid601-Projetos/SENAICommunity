package com.SenaiCommunity.BackEnd.Security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import io.jsonwebtoken.JwtParser;
import java.util.Base64;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Component
public class
JWTUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private Long expiration;

    private SecretKey getSigningKey() {
        byte[] keyBytes = Base64.getDecoder().decode(secret);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String gerarToken(UserDetails userDetails, Long userId) {
        String role = userDetails.getAuthorities().stream()
                .findFirst()
                .map(GrantedAuthority::getAuthority)
                .orElse("ROLE_USER");

        return Jwts.builder()
                .subject(userDetails.getUsername())
                .claim("role", role)
                .claim("id", userId)  // <-- Aqui adiciona o ID
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSigningKey())
                .compact();
    }
    public String getRoleDoToken(String token) {
        try {
            Claims claims = getClaims(token);
            return claims.get("role", String.class);
        } catch (Exception e) {
            return null;
        }
    }

    public String getEmailDoToken(String token) {
        try {
            Claims claims = getClaims(token);
            return claims.getSubject();
        } catch (Exception e) {
            return null;
        }
    }

    public Long getIdDoToken(String token) {
        try {
            Claims claims = getClaims(token);
            Object idObj = claims.get("id");
            if (idObj instanceof Integer) return ((Integer) idObj).longValue();
            if (idObj instanceof Long) return (Long) idObj;
            if (idObj instanceof String) return Long.parseLong((String)idObj);
            return null;
        } catch (Exception e) {
            return null;
        }
    }

    public boolean validarToken(String token) {
        try {
            Claims claims = getClaims(token);
            Date expiracao = claims.getExpiration();
            return expiracao != null && expiracao.after(new Date());
        } catch (Exception e) {
            // log aqui
            return false;
        }
    }

    public Claims getClaims(String token) {
        JwtParser parser = Jwts.parser().verifyWith(getSigningKey()).build();
        return parser.parseSignedClaims(token).getPayload();
    }


}
