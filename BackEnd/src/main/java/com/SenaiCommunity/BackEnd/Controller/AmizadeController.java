package com.SenaiCommunity.BackEnd.Controller;

import com.SenaiCommunity.BackEnd.DTO.AmigoDTO;
import com.SenaiCommunity.BackEnd.DTO.SolicitacaoAmizadeDTO;
import com.SenaiCommunity.BackEnd.Service.AmizadeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/amizades")
@PreAuthorize("hasRole('ALUNO') or hasRole('PROFESSOR')")
public class AmizadeController {

    @Autowired
    private AmizadeService amizadeService;

    /**
     * Envia uma solicitação de amizade para outro usuário.
     */
    @PostMapping("/solicitar/{idSolicitado}")
    public ResponseEntity<Void> enviarSolicitacao(@PathVariable Long idSolicitado, Principal principal) {
        amizadeService.enviarSolicitacao(principal.getName(), idSolicitado);
        return ResponseEntity.ok().build();
    }

    /**
     *Aceita uma solicitação de amizade pendente.
     */
    @PostMapping("/aceitar/{amizadeId}")
    public ResponseEntity<Void> aceitarSolicitacao(@PathVariable Long amizadeId, Principal principal) {
        amizadeService.aceitarSolicitacao(amizadeId, principal.getName());
        return ResponseEntity.ok().build();
    }

    /**
     * Recusa e remove uma solicitação de amizade pendente.
     */
    @DeleteMapping("/recusar/{amizadeId}")
    public ResponseEntity<Void> recusarSolicitacao(@PathVariable Long amizadeId, Principal principal) {
        amizadeService.recusarSolicitacao(amizadeId, principal.getName());
        return ResponseEntity.noContent().build();
    }

    /**
     * Retorna a lista de amigos do usuário autenticado.
     */
    @GetMapping("/")
    public ResponseEntity<List<AmigoDTO>> listarAmigos(Principal principal) {
        List<AmigoDTO> amigos = amizadeService.listarAmigos(principal.getName());
        return ResponseEntity.ok(amigos);
    }

    /**
     * Retorna a lista de solicitações de amizade pendentes para o usuário autenticado.
     */
    @GetMapping("/pendentes")
    public ResponseEntity<List<SolicitacaoAmizadeDTO>> listarSolicitacoesPendentes(Principal principal) {
        List<SolicitacaoAmizadeDTO> solicitacoes = amizadeService.listarSolicitacoesPendentes(principal.getName());
        return ResponseEntity.ok(solicitacoes);
    }
}