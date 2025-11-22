package com.SenaiCommunity.BackEnd.Controller;

import com.SenaiCommunity.BackEnd.DTO.MensagemPrivadaEntradaDTO;
import com.SenaiCommunity.BackEnd.DTO.MensagemPrivadaSaidaDTO;
import com.SenaiCommunity.BackEnd.Service.MensagemPrivadaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.Map;
import java.util.NoSuchElementException;

@Controller
@PreAuthorize("hasRole('ALUNO') or hasRole('PROFESSOR')")
public class MensagemPrivadaController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private MensagemPrivadaService mensagemPrivadaService;

    @MessageMapping("/chat/privado/{destinatarioId}")
    public void enviarPrivado(@DestinationVariable Long destinatarioId,
                              @Payload MensagemPrivadaEntradaDTO dto,
                              Principal principal) {

        dto.setDestinatarioId(destinatarioId);

        // Salva a mensagem no banco de dados e obtém o DTO de saída
        MensagemPrivadaSaidaDTO dtoSalvo = mensagemPrivadaService.salvarMensagemPrivada(dto, principal.getName());

        // 1. Envia para o DESTINATÁRIO
        messagingTemplate.convertAndSendToUser(dtoSalvo.getDestinatarioEmail(), "/queue/mensagens-privadas", dtoSalvo);

        // 2. ✅ CRÍTICO: Envia o ECO de volta para o REMETENTE
        messagingTemplate.convertAndSendToUser(dtoSalvo.getRemetenteEmail(), "/queue/mensagens-privadas", dtoSalvo);
    }

    // Os métodos abaixo são REST (para Editar e Excluir)
    @RestController
    @RequestMapping("/api/chat/privado")
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
                MensagemPrivadaSaidaDTO atualizada = mensagemPrivadaService.editarMensagemPrivada(id, novoConteudo, principal.getName());

                // Envia para o tópico do destinatário E do remetente
                messagingTemplate.convertAndSendToUser(atualizada.getDestinatarioEmail(), "/queue/mensagens-privadas", atualizada);
                messagingTemplate.convertAndSendToUser(atualizada.getRemetenteEmail(), "/queue/mensagens-privadas", atualizada);

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
                MensagemPrivadaSaidaDTO mensagemExcluida = mensagemPrivadaService.excluirMensagemPrivada(id, principal.getName());

                Map<String, Object> payload = Map.of("tipo", "remocao", "id", id);

                // Envia para o tópico do destinatário E do remetente
                messagingTemplate.convertAndSendToUser(mensagemExcluida.getDestinatarioEmail(), "/queue/mensagens-privadas", payload);
                messagingTemplate.convertAndSendToUser(mensagemExcluida.getRemetenteEmail(), "/queue/mensagens-privadas", payload);

                return ResponseEntity.ok().build();
            } catch (SecurityException e) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
            } catch (NoSuchElementException e) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
            }
        }
    }
}