// BackEnd/src/main/java/com/SenaiCommunity/BackEnd/Controller/AmizadeController.java (CORRIGIDO)

package com.SenaiCommunity.BackEnd.Controller;

import com.SenaiCommunity.BackEnd.DTO.AmigoDTO;
import com.SenaiCommunity.BackEnd.DTO.SolicitacaoAmizadeDTO;
import com.SenaiCommunity.BackEnd.DTO.SolicitacaoEnviadaDTO;
import com.SenaiCommunity.BackEnd.Entity.Usuario;
import com.SenaiCommunity.BackEnd.Service.AmizadeService;
import com.SenaiCommunity.BackEnd.Service.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
// ✅ 1. Importar a anotação de segurança
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/amizades")
// ✅ 2. Adicionar a anotação para proteger todos os endpoints do controller
@PreAuthorize("hasRole('ALUNO') or hasRole('PROFESSOR')")
public class AmizadeController {

    @Autowired
    private AmizadeService amizadeService;

    @Autowired
    private UsuarioService usuarioService;

    @PostMapping("/solicitar/{idSolicitado}")
    public ResponseEntity<Void> enviarSolicitacao(Principal principal, @PathVariable Long idSolicitado) {
        Usuario solicitante = usuarioService.buscarPorEmail(principal.getName());
        amizadeService.enviarSolicitacao(solicitante, idSolicitado);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/aceitar/{amizadeId}")
    public ResponseEntity<Void> aceitarSolicitacao(Principal principal, @PathVariable Long amizadeId) {
        Usuario usuarioLogado = usuarioService.buscarPorEmail(principal.getName());
        amizadeService.aceitarSolicitacao(amizadeId, usuarioLogado);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/recusar/{amizadeId}")
    public ResponseEntity<Void> recusarOuRemoverAmizade(Principal principal, @PathVariable Long amizadeId) {
        Usuario usuarioLogado = usuarioService.buscarPorEmail(principal.getName());
        amizadeService.recusarOuRemoverAmizade(amizadeId, usuarioLogado);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/pendentes")
    public ResponseEntity<List<SolicitacaoAmizadeDTO>> listarSolicitacoesPendentes(Principal principal) {
        Usuario usuarioLogado = usuarioService.buscarPorEmail(principal.getName());
        List<SolicitacaoAmizadeDTO> solicitacoes = amizadeService.listarSolicitacoesPendentes(usuarioLogado);
        return ResponseEntity.ok(solicitacoes);
    }

    @GetMapping("/enviadas")
    public ResponseEntity<List<SolicitacaoEnviadaDTO>> listarSolicitacoesEnviadas(Principal principal) {
        Usuario usuarioLogado = usuarioService.buscarPorEmail(principal.getName());
        List<SolicitacaoEnviadaDTO> solicitacoes = amizadeService.listarSolicitacoesEnviadas(usuarioLogado);
        return ResponseEntity.ok(solicitacoes);
    }

    @GetMapping("/")
    public ResponseEntity<List<AmigoDTO>> listarAmigos(Principal principal) {
        Usuario usuarioLogado = usuarioService.buscarPorEmail(principal.getName());
        List<AmigoDTO> amigos = amizadeService.listarAmigos(usuarioLogado);
        return ResponseEntity.ok(amigos);
    }

    @GetMapping("/online")
    public ResponseEntity<List<AmigoDTO>> listarAmigosOnline(Principal principal) {
        Usuario usuarioLogado = usuarioService.buscarPorEmail(principal.getName());
        List<AmigoDTO> amigosOnline = amizadeService.listarAmigosOnline(usuarioLogado);
        return ResponseEntity.ok(amigosOnline);
    }

    @GetMapping("/meus-amigos")
    public ResponseEntity<List<AmigoDTO>> listarMeusAmigos(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) return ResponseEntity.status(403).build();

        // Busca o usuário logado pelo email do token
        Usuario usuarioLogado = usuarioService.buscarPorEmail(userDetails.getUsername());

        // Busca os amigos (já com o status online/offline preenchido pelo Service)
        List<AmigoDTO> amigos = amizadeService.listarAmigos(usuarioLogado);

        return ResponseEntity.ok(amigos);
    }

    @GetMapping("/contagem/{usuarioId}")
    public ResponseEntity<Long> contarAmigos(@PathVariable Long usuarioId) {
        long count = amizadeService.contarAmigos(usuarioId);
        return ResponseEntity.ok(count);
    }
}