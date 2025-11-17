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
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

@RestController
@RequestMapping("/api/mensagens/grupo")
@PreAuthorize("hasRole('ALUNO') or hasRole('PROFESSOR')")
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
            System.out.println("Recebendo mensagem via WebSocket para projeto " + projetoId + " de " + principal.getName());

            MensagemGrupoSaidaDTO dtoSalvo = mensagemGrupoService.salvarMensagemGrupo(dto, projetoId, principal.getName());

            System.out.println("Mensagem salva com ID: " + dtoSalvo.getId() + ", enviando para tópico...");

            messagingTemplate.convertAndSend("/topic/grupo/" + projetoId, dtoSalvo);

        } catch (ConteudoImproprioException e) {
            System.err.println("Conteúdo impróprio: " + e.getMessage());
            messagingTemplate.convertAndSendToUser(principal.getName(), "/queue/errors", e.getMessage());
        } catch (Exception e) {
            System.err.println("Erro ao processar mensagem: " + e.getMessage());
            messagingTemplate.convertAndSendToUser(principal.getName(), "/queue/errors", "Não foi possível enviar a mensagem: " + e.getMessage());
        }
    }

    @GetMapping("/projeto/{projetoId}")
    public ResponseEntity<List<MensagemGrupoSaidaDTO>> getMensagensPorProjeto(@PathVariable Long projetoId) {
        try {
            List<MensagemGrupoSaidaDTO> mensagens = mensagemGrupoService.buscarMensagensPorProjeto(projetoId);
            return ResponseEntity.ok(mensagens);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/projeto/{projetoId}")
    public ResponseEntity<?> enviarMensagem(@PathVariable Long projetoId,
                                            @RequestBody MensagemGrupoEntradaDTO dto,
                                            Principal principal) {
        try {
            System.out.println("Recebendo mensagem via REST para projeto " + projetoId + " de " + principal.getName());

            MensagemGrupoSaidaDTO mensagemSalva = mensagemGrupoService.salvarMensagemGrupo(dto, projetoId, principal.getName());

            messagingTemplate.convertAndSend("/topic/grupo/" + projetoId, mensagemSalva);

            return ResponseEntity.ok(mensagemSalva);
        } catch (ConteudoImproprioException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erro ao enviar mensagem: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> editarMensagem(@PathVariable Long id,
                                            @RequestBody Map<String, String> request,
                                            Principal principal) {
        try {
            String novoConteudo = request.get("conteudo");
            MensagemGrupoSaidaDTO mensagemAtualizada = mensagemGrupoService.editarMensagemGrupo(id, novoConteudo, principal.getName());

            if (mensagemAtualizada != null) {
                messagingTemplate.convertAndSend("/topic/grupo/" + mensagemAtualizada.getGrupoId(),
                        Map.of("tipo", "atualizacao", "mensagem", mensagemAtualizada));
            }

            return ResponseEntity.ok(mensagemAtualizada);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (ConteudoImproprioException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> excluirMensagem(@PathVariable Long id, Principal principal) {
        try {
            MensagemGrupo mensagemExcluida = mensagemGrupoService.excluirMensagemGrupo(id, principal.getName());
            Long projetoId = mensagemExcluida.getProjeto().getId();

            messagingTemplate.convertAndSend("/topic/grupo/" + projetoId,
                    Map.of("tipo", "remocao", "id", id));

            return ResponseEntity.ok().build();
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (NoSuchElementException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }
}