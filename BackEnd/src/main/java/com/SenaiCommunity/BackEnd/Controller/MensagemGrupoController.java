package com.SenaiCommunity.BackEnd.Controller;

import com.SenaiCommunity.BackEnd.DTO.MensagemGrupoEntradaDTO;
import com.SenaiCommunity.BackEnd.DTO.MensagemGrupoSaidaDTO;
import com.SenaiCommunity.BackEnd.Entity.MensagemGrupo;
import com.SenaiCommunity.BackEnd.Exception.ConteudoImproprioException;
import com.SenaiCommunity.BackEnd.Service.MensagemGrupoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller; // ✅ ALTERADO DE @RestController PARA @Controller
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;
import java.util.NoSuchElementException;

@Controller
@PreAuthorize("hasRole('ALUNO') or hasRole('PROFESSOR') or hasRole('ADMIN')")
public class MensagemGrupoController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private MensagemGrupoService mensagemGrupoService;

    @MessageMapping("/grupo/{projetoId}")
    public void enviarParaGrupo(@DestinationVariable Long projetoId,
                                @Payload MensagemGrupoEntradaDTO dto,
                                Principal principal) {

        try {
            MensagemGrupoSaidaDTO dtoSalvo = mensagemGrupoService.salvarMensagemGrupo(dto, projetoId, principal.getName());

            messagingTemplate.convertAndSend("/topic/grupo/" + projetoId, dtoSalvo);

        } catch (ConteudoImproprioException e) {
            messagingTemplate.convertAndSendToUser(principal.getName(), "/queue/errors", e.getMessage());

        } catch (Exception e) {
            messagingTemplate.convertAndSendToUser(principal.getName(), "/queue/errors", "Não foi possível enviar a mensagem.");
        }
    }

    // Classe interna para os endpoints REST
    @RestController
    @RequestMapping("/mensagens/grupo")
    public static class MensagemGrupoRestController {

        @Autowired
        private MensagemGrupoService mensagemGrupoService;

        @Autowired
        private SimpMessagingTemplate messagingTemplate;

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

            } catch (NoSuchElementException e) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
            }
        }

        @DeleteMapping("/{id}")
        public ResponseEntity<?> excluirMensagem(@PathVariable Long id, Principal principal) {
            try {
                MensagemGrupo mensagemExcluida = mensagemGrupoService.excluirMensagemGrupo(id, principal.getName());
                Long projetoId = mensagemExcluida.getProjeto().getId();
                messagingTemplate.convertAndSend("/topic/grupo/" + projetoId, Map.of("tipo", "remocao", "id", id));
                return ResponseEntity.ok().build();
            } catch (SecurityException e) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
            } catch (NoSuchElementException e) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
            }
        }
    }
}
