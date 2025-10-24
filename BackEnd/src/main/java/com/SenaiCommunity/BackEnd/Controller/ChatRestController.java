package com.SenaiCommunity.BackEnd.Controller;

import com.SenaiCommunity.BackEnd.DTO.MensagemProjetoSaidaDTO;
import com.SenaiCommunity.BackEnd.DTO.MensagemPrivadaSaidaDTO;
import com.SenaiCommunity.BackEnd.DTO.PostagemSaidaDTO;
import com.SenaiCommunity.BackEnd.Service.MensagemProjetoService;
import com.SenaiCommunity.BackEnd.Service.MensagemPrivadaService;
import com.SenaiCommunity.BackEnd.Service.PostagemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
public class ChatRestController {

    @Autowired
    private MensagemPrivadaService mensagemPrivadaService;

    @Autowired
    private MensagemProjetoService mensagemGrupoService;

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
    public ResponseEntity<List<MensagemProjetoSaidaDTO>> getMensagensDoGrupo(@PathVariable Long projetoId) {
        List<MensagemProjetoSaidaDTO> mensagens = mensagemGrupoService.buscarMensagensPorProjeto(projetoId);
        return ResponseEntity.ok(mensagens);
    }

    //  Histórico de postagens públicas
    @GetMapping("/publico")
    public List<PostagemSaidaDTO> getPostagensPublicas() {
        return postagemService.buscarPostagensPublicas();
    }
}
