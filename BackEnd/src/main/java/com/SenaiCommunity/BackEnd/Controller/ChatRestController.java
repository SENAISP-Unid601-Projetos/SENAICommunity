package com.SenaiCommunity.BackEnd.Controller;

import com.SenaiCommunity.BackEnd.DTO.ConversaResumoDTO;
import com.SenaiCommunity.BackEnd.DTO.MensagemGrupoSaidaDTO;
import com.SenaiCommunity.BackEnd.DTO.MensagemPrivadaSaidaDTO;
import com.SenaiCommunity.BackEnd.Entity.Usuario;
import com.SenaiCommunity.BackEnd.Service.MensagemGrupoService;
import com.SenaiCommunity.BackEnd.Service.MensagemPrivadaService;
import com.SenaiCommunity.BackEnd.Service.PostagemService;
import com.SenaiCommunity.BackEnd.Service.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/chat")
@PreAuthorize("hasRole('ALUNO') or hasRole('PROFESSOR') or hasRole('ADMIN')")
public class ChatRestController {

    @Autowired
    private MensagemPrivadaService mensagemPrivadaService;

    @Autowired
    private MensagemGrupoService mensagemGrupoService;

    @Autowired
    private PostagemService postagemService;

    @Autowired
    private UsuarioService usuarioService;

    @GetMapping("/privado/historico/{amigoId}")
    public ResponseEntity<List<MensagemPrivadaSaidaDTO>> getMensagensPrivadasComAmigo(@PathVariable Long amigoId, Principal principal) {
        Usuario usuarioLogado = usuarioService.buscarPorEmail(principal.getName());
        List<MensagemPrivadaSaidaDTO> historico = mensagemPrivadaService.buscarMensagensPrivadas(usuarioLogado.getId(), amigoId);
        return ResponseEntity.ok(historico);
    }

    @GetMapping("/privado/minhas-conversas")
    public ResponseEntity<List<ConversaResumoDTO>> getMinhasConversas(Principal principal) {
        List<ConversaResumoDTO> resumo = mensagemPrivadaService.buscarResumoConversas(principal.getName());
        return ResponseEntity.ok(resumo);
    }

    @GetMapping("/grupo/{projetoId}")
    public ResponseEntity<Page<MensagemGrupoSaidaDTO>> getMensagensDoGrupo(
            @PathVariable Long projetoId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        // Agora chamamos o método com os 3 parâmetros corretos
        Page<MensagemGrupoSaidaDTO> mensagens = mensagemGrupoService.buscarMensagensPorProjetoPaginado(projetoId, page, size);
        return ResponseEntity.ok(mensagens);
    }

    @GetMapping("/publico")
    public ResponseEntity<?> getPostagensPublicas() {
        try {
            // Tenta buscar as postagens
            return ResponseEntity.ok(postagemService.buscarPostagensPublicas());
        } catch (Exception e) {
            // Se der erro, imprime no console do Railway para sabermos o motivo
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Erro no servidor: " + e.getMessage());
        }
    }

    @GetMapping("/privado/nao-lidas/contagem")
    public ResponseEntity<Long> getContagemNaoLidas(Principal principal) {
        long contagem = mensagemPrivadaService.contarMensagensNaoLidas(principal.getName());
        return ResponseEntity.ok(contagem);
    }

    @PostMapping("/privado/marcar-lida/{remetenteId}")
    public ResponseEntity<Void> marcarComoLida(@PathVariable Long remetenteId, Principal principal) {
        try {
            mensagemPrivadaService.marcarConversaComoLida(principal.getName(), remetenteId);
            return ResponseEntity.ok().build();
        } catch (NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}