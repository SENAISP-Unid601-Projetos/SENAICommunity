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
@PreAuthorize("hasRole('ALUNO') or hasRole('PROFESSOR') or hasRole('ADMIN')")
public class MensagemPrivadaController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private MensagemPrivadaService mensagemPrivadaService;

    @MessageMapping("/privado/{destinatarioId}")
    public void enviarPrivado(@DestinationVariable Long destinatarioId,
                              @Payload MensagemPrivadaEntradaDTO dto,
                              Principal principal) {

        dto.setDestinatarioId(destinatarioId);
        MensagemPrivadaSaidaDTO dtoSalvo = mensagemPrivadaService.salvarMensagemPrivada(dto, principal.getName());

        // Envia a mensagem para o destinatário
        messagingTemplate.convertAndSendToUser(dtoSalvo.getDestinatarioEmail(), "/queue/usuario", dtoSalvo);

        // Envia a mensagem de volta para o remetente (confirmação)
        messagingTemplate.convertAndSendToUser(principal.getName(), "/queue/usuario", dtoSalvo);

        // Envia a nova contagem para o DESTINATÁRIO ---
        long novaContagem = mensagemPrivadaService.contarMensagensNaoLidas(dtoSalvo.getDestinatarioEmail());
        messagingTemplate.convertAndSendToUser(dtoSalvo.getDestinatarioEmail(), "/queue/contagem", novaContagem);
    }

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
                messagingTemplate.convertAndSendToUser(atualizada.getDestinatarioEmail(), "/queue/usuario", atualizada);
                messagingTemplate.convertAndSendToUser(atualizada.getRemetenteEmail(), "/queue/usuario", atualizada);

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

                Map<String, Object> payload = Map.of(
                        "tipo", "remocao",
                        "id", id,
                        "remetenteId", mensagemExcluida.getRemetenteId(),
                        "destinatarioId", mensagemExcluida.getDestinatarioId()
                );

                messagingTemplate.convertAndSendToUser(mensagemExcluida.getDestinatarioEmail(), "/queue/usuario", payload);
                messagingTemplate.convertAndSendToUser(mensagemExcluida.getRemetenteEmail(), "/queue/usuario", payload);

                return ResponseEntity.ok().build();
            } catch (SecurityException e) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
            } catch (NoSuchElementException e) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
            }
        }

    }
}
