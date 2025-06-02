package com.SenaiCommunity.BackEnd.Controller;

import com.SenaiCommunity.BackEnd.DTO.UsuarioLoginDTO;
import com.SenaiCommunity.BackEnd.Entity.Professor;
import com.SenaiCommunity.BackEnd.Entity.Usuario;
import com.SenaiCommunity.BackEnd.Repository.ProfessorRepository;
import com.SenaiCommunity.BackEnd.Repository.UsuarioRepository;
import com.SenaiCommunity.BackEnd.Security.JWTUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/autenticacao")
public class AutenticacaoController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JWTUtil jwtUtil;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody UsuarioLoginDTO dto) {
        Optional<Usuario> usuario = usuarioRepository.findByEmail(dto.getEmail());

        // Debug: mostre a senha codificada armazenada
        System.out.println("Senha armazenada: " + usuario.get().getSenha());

        if (usuario.isEmpty() || !passwordEncoder.matches(dto.getSenha(), usuario.get().getSenha())) {
            return ResponseEntity.status(401).body("Email ou senha inválidos");
        }

        String token = jwtUtil.gerarToken(usuario.get().getEmail());
        return ResponseEntity.ok().body(token);
    }
}
