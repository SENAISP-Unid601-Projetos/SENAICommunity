package com.SenaiCommunity.BackEnd.Controller;

import com.SenaiCommunity.BackEnd.Entity.AlertaVaga;
import com.SenaiCommunity.BackEnd.Entity.Usuario;
import com.SenaiCommunity.BackEnd.Enum.NivelVaga;
import com.SenaiCommunity.BackEnd.Repository.AlertaVagaRepository;
import com.SenaiCommunity.BackEnd.Repository.UsuarioRepository;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/alertas")
public class AlertaVagaController {

    @Autowired private AlertaVagaRepository alertaRepository;
    @Autowired private UsuarioRepository usuarioRepository;

    // LISTAR MEUS ALERTAS
    @GetMapping
    public ResponseEntity<List<AlertaSaidaDTO>> listarMeusAlertas(Principal principal) {
        Usuario usuario = usuarioRepository.findByEmail(principal.getName()).orElseThrow();
        // Busca alertas onde o usuário é o dono
        List<AlertaVaga> alertas = alertaRepository.findByUsuario(usuario);

        List<AlertaSaidaDTO> dtos = alertas.stream()
                .map(a -> new AlertaSaidaDTO(a.getId(), a.getPalavraChave(), a.getNivelInteresse() != null ? a.getNivelInteresse().name() : null))
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    // CRIAR ALERTA
    @PostMapping
    public ResponseEntity<AlertaSaidaDTO> criarAlerta(@RequestBody AlertaEntradaDTO dto, Principal principal) {
        Usuario user = usuarioRepository.findByEmail(principal.getName()).orElseThrow();

        AlertaVaga alerta = new AlertaVaga();
        alerta.setUsuario(user);
        alerta.setPalavraChave(dto.getPalavraChave());
        if(dto.getNivel() != null && !dto.getNivel().isEmpty()) {
            alerta.setNivelInteresse(NivelVaga.valueOf(dto.getNivel()));
        }

        AlertaVaga salvo = alertaRepository.save(alerta);
        return ResponseEntity.ok(new AlertaSaidaDTO(salvo.getId(), salvo.getPalavraChave(), salvo.getNivelInteresse() != null ? salvo.getNivelInteresse().name() : null));
    }

    // EDITAR ALERTA
    @PutMapping("/{id}")
    public ResponseEntity<AlertaSaidaDTO> editarAlerta(@PathVariable Long id, @RequestBody AlertaEntradaDTO dto, Principal principal) {
        Usuario user = usuarioRepository.findByEmail(principal.getName()).orElseThrow();
        AlertaVaga alerta = alertaRepository.findById(id).orElseThrow(() -> new RuntimeException("Alerta não encontrado"));

        if (!alerta.getUsuario().getId().equals(user.getId())) {
            throw new AccessDeniedException("Você não tem permissão para editar este alerta.");
        }

        alerta.setPalavraChave(dto.getPalavraChave());
        if(dto.getNivel() != null && !dto.getNivel().isEmpty()) {
            alerta.setNivelInteresse(NivelVaga.valueOf(dto.getNivel()));
        } else {
            alerta.setNivelInteresse(null); // Permite limpar o nível
        }

        AlertaVaga atualizado = alertaRepository.save(alerta);
        return ResponseEntity.ok(new AlertaSaidaDTO(atualizado.getId(), atualizado.getPalavraChave(), atualizado.getNivelInteresse() != null ? atualizado.getNivelInteresse().name() : null));
    }

    // EXCLUIR ALERTA
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluirAlerta(@PathVariable Long id, Principal principal) {
        Usuario user = usuarioRepository.findByEmail(principal.getName()).orElseThrow();
        AlertaVaga alerta = alertaRepository.findById(id).orElseThrow(() -> new RuntimeException("Alerta não encontrado"));

        if (!alerta.getUsuario().getId().equals(user.getId())) {
            throw new AccessDeniedException("Você não tem permissão para excluir este alerta.");
        }

        alertaRepository.delete(alerta);
        return ResponseEntity.noContent().build();
    }

    // DTOs Internos
    @Data @NoArgsConstructor @AllArgsConstructor
    static class AlertaEntradaDTO {
        private String palavraChave;
        private String nivel;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    static class AlertaSaidaDTO {
        private Long id;
        private String palavraChave;
        private String nivel;
    }
}