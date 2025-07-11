package com.SenaiCommunity.BackEnd.Controller;

import com.SenaiCommunity.BackEnd.Entity.MensagemGrupo;
import com.SenaiCommunity.BackEnd.Entity.MensagemPrivada;
import com.SenaiCommunity.BackEnd.Entity.Postagem;
import com.SenaiCommunity.BackEnd.Service.MensagemGrupoService;
import com.SenaiCommunity.BackEnd.Service.MensagemPrivadaService;
import com.SenaiCommunity.BackEnd.Service.PostagemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

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

    //  Histórico de mensagens privadas entre dois usuários
    @GetMapping("/privado/{userId1}/{userId2}")
    public List<MensagemPrivada> getMensagensPrivadas(@PathVariable Long userId1,
                                                      @PathVariable Long userId2) {
        return mensagemPrivadaService.buscarMensagensPrivadas(userId1, userId2);
    }

    //  Histórico de mensagens de grupo
    @GetMapping("/grupo/{projetoId}")
    public List<MensagemGrupo> getMensagensGrupo(@PathVariable Long projetoId) {
        return mensagemGrupoService.buscarMensagensDoGrupo(projetoId);
    }

    //  Histórico de postagens públicas
    @GetMapping("/publico")
    public List<Postagem> getPostagensPublicas() {
        return postagemService.buscarPostagensPublicas();
    }
}
