package com.SenaiCommunity.BackEnd.Controller;

import com.SenaiCommunity.BackEnd.DTO.UsuarioLoginDTO;
import com.SenaiCommunity.BackEnd.Security.JWTUtil;
import com.SenaiCommunity.BackEnd.Service.UsuarioDetailsImpl;
import com.SenaiCommunity.BackEnd.Service.UsuarioDetailsService;
import com.SenaiCommunity.BackEnd.DTO.TokenDTO;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/autenticacao")
public class AutenticacaoController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UsuarioDetailsService userDetailsService;

    @Autowired
    private JWTUtil jwtUtil;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody UsuarioLoginDTO dto) {
        if (dto.getEmail() == null || dto.getSenha() == null) {
            return ResponseEntity.badRequest().body("Email e senha são obrigatórios");
        }

        try {
            // 1. Autenticar
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(dto.getEmail(), dto.getSenha())
            );

            UserDetails userDetails = userDetailsService.loadUserByUsername(dto.getEmail());

            // Pegando o id
            Long id = ((UsuarioDetailsImpl) userDetails).getId();

            // Gerar token com ID como claim personalizada
            String token = jwtUtil.gerarToken(userDetails, id);

            // 4. Retornar token no body
            return ResponseEntity.ok(new TokenDTO(token));
        } catch (Exception e) {
            return ResponseEntity.status(401).body("Credenciais inválidas");
        }
    }
}
