package com.SenaiCommunity.BackEnd.Controller;

import com.SenaiCommunity.BackEnd.Entity.MensagemGrupo;
import com.SenaiCommunity.BackEnd.Repository.MensagemGrupoRepository;
import com.SenaiCommunity.BackEnd.Repository.UsuarioRepository;
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
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.NoSuchElementException;

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
            // Notifica o tópico do projeto sobre a edição da mensagem
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
            // O serviço agora retorna a mensagem que foi excluída para obtermos o ID do projeto
            MensagemGrupo mensagemExcluida = mensagemGrupoService.excluirMensagemGrupo(id, principal.getName());

            // Correção: Enviar a notificação para o tópico do projeto
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