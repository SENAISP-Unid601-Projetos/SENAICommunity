package com.SenaiCommunity.BackEnd.Controller;

import com.SenaiCommunity.BackEnd.Entity.AlertaVaga;
import com.SenaiCommunity.BackEnd.Entity.Usuario;
import com.SenaiCommunity.BackEnd.Enum.NivelVaga;
import com.SenaiCommunity.BackEnd.Repository.UsuarioRepository;
import com.SenaiCommunity.BackEnd.Repository.AlertaVagaRepository; // Você precisará criar a interface Repository simples
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;

@RestController
@RequestMapping("/api/alertas")
public class AlertaVagaController {

    @Autowired private AlertaVagaRepository alertaRepository;
    @Autowired private UsuarioRepository usuarioRepository;

    @PostMapping
    public ResponseEntity<String> criarAlerta(@RequestBody AlertaDTO dto, Principal principal) {
        Usuario user = usuarioRepository.findByEmail(principal.getName()).orElseThrow();

        AlertaVaga alerta = new AlertaVaga();
        alerta.setUsuario(user);
        alerta.setPalavraChave(dto.palavraChave);
        if(dto.nivel != null && !dto.nivel.isEmpty()) {
            alerta.setNivelInteresse(NivelVaga.valueOf(dto.nivel));
        }

        alertaRepository.save(alerta);
        return ResponseEntity.ok("Alerta criado com sucesso! Você será notificado.");
    }

    @Data
    static class AlertaDTO {
        String palavraChave;
        String nivel;
    }
}