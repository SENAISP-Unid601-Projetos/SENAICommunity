package com.SenaiCommunity.BackEnd.Controller;

<<<<<<< HEAD
=======
import com.SenaiCommunity.BackEnd.DTO.MensagemGrupoSaidaDTO;
import com.SenaiCommunity.BackEnd.DTO.MensagemPrivadaSaidaDTO;
>>>>>>> back
import com.SenaiCommunity.BackEnd.DTO.PostagemSaidaDTO;
import com.SenaiCommunity.BackEnd.Entity.MensagemGrupo;
import com.SenaiCommunity.BackEnd.Entity.MensagemPrivada;
import com.SenaiCommunity.BackEnd.Entity.Postagem;
import com.SenaiCommunity.BackEnd.Service.MensagemGrupoService;
import com.SenaiCommunity.BackEnd.Service.MensagemPrivadaService;
import com.SenaiCommunity.BackEnd.Service.PostagemService;
import org.springframework.beans.factory.annotation.Autowired;
<<<<<<< HEAD
=======
import org.springframework.http.ResponseEntity;
>>>>>>> back
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
<<<<<<< HEAD
    public List<MensagemPrivada> getMensagensPrivadas(@PathVariable Long userId1,
                                                      @PathVariable Long userId2) {
        return mensagemPrivadaService.buscarMensagensPrivadas(userId1, userId2);
=======
    public ResponseEntity<List<MensagemPrivadaSaidaDTO>> getMensagensPrivadas(@PathVariable Long userId1,
                                                                              @PathVariable Long userId2) {
        List<MensagemPrivadaSaidaDTO> historico = mensagemPrivadaService.buscarMensagensPrivadas(userId1, userId2);
        return ResponseEntity.ok(historico);
>>>>>>> back
    }

    //  Histórico de mensagens de grupo
    @GetMapping("/grupo/{projetoId}")
<<<<<<< HEAD
    public List<MensagemGrupo> getMensagensGrupo(@PathVariable Long projetoId) {
        return mensagemGrupoService.buscarMensagensDoGrupo(projetoId);
=======
    public ResponseEntity<List<MensagemGrupoSaidaDTO>> getMensagensDoGrupo(@PathVariable Long projetoId) {
        List<MensagemGrupoSaidaDTO> mensagens = mensagemGrupoService.buscarMensagensPorProjeto(projetoId);
        return ResponseEntity.ok(mensagens);
>>>>>>> back
    }

    //  Histórico de postagens públicas
    @GetMapping("/publico")
    public List<PostagemSaidaDTO> getPostagensPublicas() {
        return postagemService.buscarPostagensPublicas();
    }
}
