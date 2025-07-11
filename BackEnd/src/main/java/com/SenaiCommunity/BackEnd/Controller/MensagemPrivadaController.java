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
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.Map;

@RestController("/chat-privado")
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

        messagingTemplate.convertAndSend("/queue/usuario/" + destinatarioId, salva);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> editarMensagem(@PathVariable Long id,
                                            @RequestBody String novoConteudo,
                                            Principal principal) {
        try {
            MensagemPrivada atualizada = mensagemPrivadaService.editarMensagemPrivada(id, novoConteudo, principal.getName());
            messagingTemplate.convertAndSend("/queue/usuario/" + atualizada.getDestinatario().getId(), atualizada);
            return ResponseEntity.ok(atualizada);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> excluirMensagem(@PathVariable Long id,
                                             Principal principal) {
        try {
            Long mensagemId = mensagemPrivadaService.excluirMensagemPrivada(id, principal.getName());
            messagingTemplate.convertAndSend("/queue/usuario/" + mensagemId, Map.of("tipo", "remocao", "id", mensagemId));
            return ResponseEntity.ok().build();
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
    }
}
