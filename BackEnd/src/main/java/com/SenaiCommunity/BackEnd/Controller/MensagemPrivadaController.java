package com.SenaiCommunity.BackEnd.Controller;

import com.SenaiCommunity.BackEnd.DTO.MensagemPrivadaEntradaDTO;
import com.SenaiCommunity.BackEnd.DTO.MensagemPrivadaSaidaDTO;
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
import org.springframework.stereotype.Controller; // ✅ ALTERADO DE @RestController PARA @Controller
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;
import java.util.NoSuchElementException;

@Controller // ✅ ALTERADO DE @RestController PARA @Controller
@PreAuthorize("hasRole('ALUNO') or hasRole('PROFESSOR')")
public class MensagemPrivadaController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private MensagemPrivadaService mensagemPrivadaService;

    // ✅ ATUALIZADO PARA USAR DTOS
    @MessageMapping("/privado/{destinatarioId}")
    public void enviarPrivado(@DestinationVariable Long destinatarioId,
                              @Payload MensagemPrivadaEntradaDTO dto, // <-- Recebe DTO de Entrada
                              Principal principal) {

        dto.setDestinatarioId(destinatarioId); // Garante que o ID do destinatário está no DTO

        MensagemPrivadaSaidaDTO dtoSalvo = mensagemPrivadaService.salvarMensagemPrivada(dto, principal.getName());

        messagingTemplate.convertAndSendToUser(dtoSalvo.getDestinatarioEmail(), "/queue/usuario", dtoSalvo);

        // Notifica o próprio remetente para atualizar a UI
        messagingTemplate.convertAndSendToUser(principal.getName(), "/queue/usuario", dtoSalvo);
    }

    // Os métodos abaixo são REST, então precisam estar em um controller com @RestController
    // Considere mover para um controller separado ou manter @RestController e anotar os métodos @MessageMapping em uma classe @Controller separada.
    // Por simplicidade, vamos mantê-los aqui por enquanto.
    @RestController
    @RequestMapping("/chat-privado")
    public static class MensagemPrivadaRestController {

        @Autowired
        private MensagemPrivadaService mensagemPrivadaService;

        @Autowired
        private SimpMessagingTemplate messagingTemplate;

        @PutMapping("/{id}")
        public ResponseEntity<?> editarMensagem(@PathVariable Long id,
                                                @RequestBody String novoConteudo,
                                                Principal principal) {
            try {
                MensagemPrivada atualizada = mensagemPrivadaService.editarMensagemPrivada(id, novoConteudo, principal.getName());
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
                MensagemPrivada mensagemExcluida = mensagemPrivadaService.excluirMensagemPrivada(id, principal.getName());
                Map<String, Object> payload = Map.of("tipo", "remocao", "id", id);
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
}