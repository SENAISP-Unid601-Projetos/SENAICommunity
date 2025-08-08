package com.SenaiCommunity.BackEnd.Security;

import com.SenaiCommunity.BackEnd.Entity.Usuario;
import com.SenaiCommunity.BackEnd.Repository.UsuarioRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtParser;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Component
public class JWTUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private Long expiration;

    // ✅ ADIÇÃO: Injeta o repositório para buscar o usuário
    @Autowired
    private UsuarioRepository usuarioRepository;

    private SecretKey getSigningKey() {
        byte[] keyBytes = Base64.getDecoder().decode(secret);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    // ✅ MÉTODO MODIFICADO: Agora adiciona 'userId' e 'tipoUsuario' ao token
    public String gerarToken(UserDetails userDetails) {
        // Busca o objeto Usuario completo para obter o ID e o tipo
        Usuario usuario = usuarioRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado ao gerar token para: " + userDetails.getUsername()));

        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", usuario.getId());
        claims.put("tipoUsuario", usuario.getTipoUsuario()); // 'Aluno' ou 'Professor'

        return Jwts.builder()
                .subject(userDetails.getUsername()) // O email do usuário
                .claims(claims) // Adiciona as informações extras (ID e tipo)
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSigningKey())
                .compact();
    }

    // Este método não é mais necessário para a lógica principal, mas pode ser mantido
    public String getRoleDoToken(String token) {
        Claims claims = validarToken(token);
        // O nome da claim foi alterado para tipoUsuario, mas podemos manter a compatibilidade
        if (claims != null && claims.containsKey("tipoUsuario")) {
            return claims.get("tipoUsuario", String.class);
        }
        return claims != null ? claims.get("role", String.class) : null;
    }

    public String getEmailDoToken(String token) {
        Claims claims = validarToken(token);
        return claims != null ? claims.getSubject() : null;
    }


    public Claims validarToken(String token) {
        try {
            JwtParser parser = Jwts.parser().verifyWith(getSigningKey()).build();
            return parser.parseSignedClaims(token).getPayload();
        } catch (Exception e) {
            System.out.println("Erro ao validar token: " + e.getMessage());
            return null;
        }
    }

    public Claims getClaims(String token) {
        return validarToken(token);
    }

}