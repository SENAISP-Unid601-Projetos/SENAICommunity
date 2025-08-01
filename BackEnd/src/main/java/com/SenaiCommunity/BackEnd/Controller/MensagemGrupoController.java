package com.SenaiCommunity.BackEnd.Controller;

import com.SenaiCommunity.BackEnd.Entity.MensagemGrupo;
import com.SenaiCommunity.BackEnd.Repository.MensagemGrupoRepository;
import com.SenaiCommunity.BackEnd.Repository.UsuarioRepository;
import com.SenaiCommunity.BackEnd.Service.MensagemGrupoService;
import com.SenaiCommunity.BackEnd.Service.MensagemPrivadaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/mensagens/grupo")
@PreAuthorize("hasRole('ALUNO') or hasRole('PROFESSOR')")
public class MensagemGrupoController {

    @Autowired
    private MensagemGrupoRepository mensagemGrupoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private MensagemGrupoService mensagemGrupoService;

    // 🔹 CHAT DE GRUPO
    @MessageMapping("/{projetoId}")
    @SendTo("/topic/grupo/{projetoId}")
    public MensagemGrupo enviarParaGrupo(@DestinationVariable Long projetoId,
                                         @Payload MensagemGrupo mensagem,
                                         Principal principal) {
        mensagem.setDataEnvio(LocalDateTime.now());
        mensagem.setAutorUsername(principal.getName());
        return mensagemGrupoService.salvarMensagemGrupo(mensagem, projetoId);
    }


    @PutMapping("/{id}")
        public ResponseEntity<?> editarMensagem(@PathVariable Long id,
                                                @RequestBody String novoConteudo,
                                                Principal principal) {
            try {
                MensagemGrupo mensagemAtualizada = mensagemGrupoService.editarMensagemGrupo(id, novoConteudo, principal.getName());
                messagingTemplate.convertAndSend("/topic/grupo/" + mensagemAtualizada.getProjeto().getId(), mensagemAtualizada);
                return ResponseEntity.ok(mensagemAtualizada);
            } catch (SecurityException e) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
            }
        }

        @DeleteMapping("/{id}")
        public ResponseEntity<?> excluirMensagem(@PathVariable Long id, Principal principal) {
            try {
                Long mensagemId = mensagemGrupoService.excluirMensagemGrupo(id, principal.getName());
                messagingTemplate.convertAndSend("/topic/grupo/" + id, Map.of("tipo", "remocao", "id", mensagemId));
                return ResponseEntity.ok().build();
            } catch (SecurityException e) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
            }
        }
}

