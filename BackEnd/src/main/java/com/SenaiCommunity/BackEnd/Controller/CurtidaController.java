package com.SenaiCommunity.BackEnd.Controller;

import com.SenaiCommunity.BackEnd.DTO.CurtidaEntradaDTO;
import com.SenaiCommunity.BackEnd.Entity.Usuario;
import com.SenaiCommunity.BackEnd.Service.CurtidaService;
import com.SenaiCommunity.BackEnd.Service.UsuarioService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/curtidas")
@PreAuthorize("hasRole('ALUNO') or hasRole('PROFESSOR')")
public class CurtidaController {

    @Autowired
    private CurtidaService curtidaService;

    @Autowired
    private UsuarioService usuarioService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @PostMapping("/toggle")
    public ResponseEntity<?> toggleCurtida(@RequestBody CurtidaEntradaDTO dto, Principal principal) {
        try {
            Long postagemIdParaNotificar = curtidaService.toggleCurtida(principal.getName(), dto.getPostagemId(), dto.getComentarioId());

            Usuario autorDaAcao = usuarioService.buscarPorEmail(principal.getName());

            if (postagemIdParaNotificar != null) {
                Map<String, Object> payload = Map.of(
                        "tipo", "atualizacao_curtida",
                        "id", postagemIdParaNotificar,
                        "autorAcaoId", autorDaAcao.getId()
                );
                messagingTemplate.convertAndSend("/topic/publico", payload);
            }

            return ResponseEntity.ok().build();
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }
}