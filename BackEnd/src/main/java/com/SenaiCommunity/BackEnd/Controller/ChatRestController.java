package com.SenaiCommunity.BackEnd.Controller;

import com.SenaiCommunity.BackEnd.DTO.ConversaResumoDTO;
import com.SenaiCommunity.BackEnd.DTO.MensagemGrupoSaidaDTO;
import com.SenaiCommunity.BackEnd.DTO.MensagemPrivadaSaidaDTO;
import com.SenaiCommunity.BackEnd.DTO.PostagemSaidaDTO;
import com.SenaiCommunity.BackEnd.Entity.MensagemGrupo;
import com.SenaiCommunity.BackEnd.Entity.MensagemPrivada;
import com.SenaiCommunity.BackEnd.Entity.Postagem;
import com.SenaiCommunity.BackEnd.Entity.Usuario;
import com.SenaiCommunity.BackEnd.Service.MensagemGrupoService;
import com.SenaiCommunity.BackEnd.Service.MensagemPrivadaService;
import com.SenaiCommunity.BackEnd.Service.PostagemService;
import com.SenaiCommunity.BackEnd.Service.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/chat")
//Essa controller serve buscar os históricos de conversa dos chats
public class ChatRestController {

    @Autowired
    private MensagemPrivadaService mensagemPrivadaService;

    @Autowired
    private MensagemGrupoService mensagemGrupoService;

    @Autowired
    private PostagemService postagemService;

    @Autowired
    private UsuarioService usuarioService;

    //  Histórico de mensagens privadas entre dois usuários
    @GetMapping("/privado/historico/{amigoId}")
    public ResponseEntity<List<MensagemPrivadaSaidaDTO>> getMensagensPrivadasComAmigo(@PathVariable Long amigoId, Principal principal) {
        Usuario usuarioLogado = usuarioService.buscarPorEmail(principal.getName());
        Long usuarioLogadoId = usuarioLogado.getId();

        // 2. Busca o histórico
        List<MensagemPrivadaSaidaDTO> historico = mensagemPrivadaService.buscarMensagensPrivadas(usuarioLogadoId, amigoId);
        return ResponseEntity.ok(historico);
    }

    @GetMapping("/privado/minhas-conversas")
    public ResponseEntity<List<ConversaResumoDTO>> getMinhasConversas(Principal principal) {
        List<ConversaResumoDTO> resumo = mensagemPrivadaService.buscarResumoConversas(principal.getName());
        return ResponseEntity.ok(resumo);
    }

    //  Histórico de mensagens de grupo
    @GetMapping("/grupo/{projetoId}")
    public ResponseEntity<List<MensagemGrupoSaidaDTO>> getMensagensDoGrupo(@PathVariable Long projetoId) {
        List<MensagemGrupoSaidaDTO> mensagens = mensagemGrupoService.buscarMensagensPorProjeto(projetoId);
        return ResponseEntity.ok(mensagens);
    }

    //  Histórico de postagens públicas
    @GetMapping("/publico")
    public List<PostagemSaidaDTO> getPostagensPublicas() {
        return postagemService.buscarPostagensPublicas();
    }

    @GetMapping("/privado/nao-lidas/contagem")
    public ResponseEntity<Long> getContagemNaoLidas(Principal principal) {
        long contagem = mensagemPrivadaService.contarMensagensNaoLidas(principal.getName());
        return ResponseEntity.ok(contagem);
    }
}

