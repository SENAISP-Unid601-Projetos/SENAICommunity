package com.SenaiCommunity.BackEnd.Controller;


import com.SenaiCommunity.BackEnd.Entity.MensagemPrivada;
import com.SenaiCommunity.BackEnd.Service.MensagemPrivadaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/chat-privado")
@PreAuthorize("hasRole('ALUNO') or hasRole('PROFESSOR')")
public class MensagemPrivadaController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private MensagemPrivadaService mensagemPrivadaService;

    // 🔹 CHAT PRIVADO
    @MessageMapping("/{destinatarioId}")
    public void enviarPrivado(@DestinationVariable Long destinatarioId,
                              @Payload MensagemPrivada mensagem,
                              Principal principal) {
        mensagem.setDataEnvio(LocalDateTime.now());
        mensagem.setRemetenteUsername(principal.getName());

        MensagemPrivada salva = mensagemPrivadaService.salvarMensagemPrivada(mensagem, destinatarioId);

        // Notifica o destinatário
        messagingTemplate.convertAndSend("/queue/usuario/" + destinatarioId, salva);
        // Notifica o próprio remetente para atualizar a UI
        messagingTemplate.convertAndSend("/queue/usuario/" + salva.getRemetente().getId(), salva);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> editarMensagem(@PathVariable Long id,
                                            @RequestBody String novoConteudo,
                                            Principal principal) {
        try {
            MensagemPrivada atualizada = mensagemPrivadaService.editarMensagemPrivada(id, novoConteudo, principal.getName());

            // Notifica tanto o destinatário quanto o remetente sobre a edição
            messagingTemplate.convertAndSend("/queue/usuario/" + atualizada.getDestinatario().getId(), atualizada);
            messagingTemplate.convertAndSend("/queue/usuario/" + atualizada.getRemetente().getId(), atualizada);

            return ResponseEntity.ok(atualizada);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> excluirMensagem(@PathVariable Long id,
                                             Principal principal) {
        try {
            // O serviço agora retorna a entidade completa que foi excluída
            MensagemPrivada mensagemExcluida = mensagemPrivadaService.excluirMensagemPrivada(id, principal.getName());

            // Payload da notificação
            Map<String, Object> payload = Map.of("tipo", "remocao", "id", id);

            // Correção: Notifica o destinatário e o remetente na fila de usuário correta
            messagingTemplate.convertAndSend("/queue/usuario/" + mensagemExcluida.getDestinatario().getId(), payload);
            messagingTemplate.convertAndSend("/queue/usuario/" + mensagemExcluida.getRemetente().getId(), payload);

            return ResponseEntity.ok().build();
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }
}