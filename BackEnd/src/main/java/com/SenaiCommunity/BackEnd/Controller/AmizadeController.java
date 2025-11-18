package com.SenaiCommunity.BackEnd.Controller;

import com.SenaiCommunity.BackEnd.DTO.AmigoDTO;
import com.SenaiCommunity.BackEnd.DTO.SolicitacaoAmizadeDTO;
import com.SenaiCommunity.BackEnd.DTO.SolicitacaoEnviadaDTO;
import com.SenaiCommunity.BackEnd.DTO.UsuarioSaidaDTO;
import com.SenaiCommunity.BackEnd.Entity.Usuario;
import com.SenaiCommunity.BackEnd.Service.AmizadeService;
import com.SenaiCommunity.BackEnd.Service.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/amizades")
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


    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<List<AmigoDTO>> listarAmigosDoUsuario(@PathVariable Long usuarioId, Principal principal) {
        try {
            Usuario usuarioAlvo = usuarioService.buscarEntidadePorId(usuarioId);

            List<AmigoDTO> amigos = amizadeService.listarAmigos(usuarioAlvo);

            return ResponseEntity.ok(amigos);
        } catch (UsernameNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }
}