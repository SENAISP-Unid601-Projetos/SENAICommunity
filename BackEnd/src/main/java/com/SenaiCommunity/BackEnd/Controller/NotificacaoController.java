package com.SenaiCommunity.BackEnd.Controller;

import com.SenaiCommunity.BackEnd.DTO.NotificacaoSaidaDTO; // Você precisará criar este DTO
import com.SenaiCommunity.BackEnd.Service.NotificacaoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/notificacoes")
@PreAuthorize("hasRole('ALUNO') or hasRole('PROFESSOR')")
public class NotificacaoController {

    @Autowired
    private NotificacaoService notificacaoService;

    @GetMapping
    public ResponseEntity<List<NotificacaoSaidaDTO>> buscarMinhasNotificacoes(Principal principal) {
        List<NotificacaoSaidaDTO> notificacoes = notificacaoService.buscarPorDestinatario(principal.getName());
        return ResponseEntity.ok(notificacoes);
    }

    @PostMapping("/{id}/ler")
    public ResponseEntity<Void> marcarComoLida(@PathVariable Long id, Principal principal) {
        notificacaoService.marcarComoLida(id, principal.getName());
        return ResponseEntity.ok().build();
    }
}