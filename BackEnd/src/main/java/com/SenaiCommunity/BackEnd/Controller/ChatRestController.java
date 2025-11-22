package com.SenaiCommunity.BackEnd.Controller;

import com.SenaiCommunity.BackEnd.DTO.MensagemGrupoSaidaDTO;
import com.SenaiCommunity.BackEnd.DTO.MensagemPrivadaSaidaDTO;
import com.SenaiCommunity.BackEnd.DTO.PostagemSaidaDTO;
import com.SenaiCommunity.BackEnd.Entity.MensagemGrupo;
import com.SenaiCommunity.BackEnd.Entity.MensagemPrivada;
import com.SenaiCommunity.BackEnd.Entity.Postagem;
import com.SenaiCommunity.BackEnd.Service.MensagemGrupoService;
import com.SenaiCommunity.BackEnd.Service.MensagemPrivadaService;
import com.SenaiCommunity.BackEnd.Service.PostagemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
// ✅ 1. Importar a anotação de segurança
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
// ✅ 2. Adicionar a anotação para proteger todos os endpoints do controller
@PreAuthorize("hasRole('ALUNO') or hasRole('PROFESSOR')")
public class ChatRestController {

    @Autowired
    private MensagemPrivadaService mensagemPrivadaService;

    @Autowired
    private MensagemGrupoService mensagemGrupoService;

    @Autowired
    private PostagemService postagemService;

    //  Histórico de mensagens privadas entre dois usuários
    @GetMapping("/privado/{userId1}/{userId2}")
    public ResponseEntity<List<MensagemPrivadaSaidaDTO>> getMensagensPrivadas(@PathVariable Long userId1,
                                                                              @PathVariable Long userId2) {
        List<MensagemPrivadaSaidaDTO> historico = mensagemPrivadaService.buscarMensagensPrivadas(userId1, userId2);
        return ResponseEntity.ok(historico);
    }

    //  Histórico de mensagens de grupo
    @GetMapping("/grupo/{projetoId}")
    public ResponseEntity<List<MensagemGrupoSaidaDTO>> getMensagensDoGrupo(@PathVariable Long projetoId) {
        // ✅ 3. CORREÇÃO: O nome do método foi corrigido
        List<MensagemGrupoSaidaDTO> mensagens = mensagemGrupoService.buscarMensagensPorGrupo(projetoId);
        return ResponseEntity.ok(mensagens);
    }

    //  Histórico de postagens públicas
    @GetMapping("/publico")
    public List<PostagemSaidaDTO> getPostagensPublicas() {
        return postagemService.buscarPostagensPublicas();
    }
}