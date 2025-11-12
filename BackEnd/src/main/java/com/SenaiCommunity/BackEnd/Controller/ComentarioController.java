package com.SenaiCommunity.BackEnd.Controller;

import com.SenaiCommunity.BackEnd.DTO.ComentarioEntradaDTO;
import com.SenaiCommunity.BackEnd.DTO.ComentarioSaidaDTO;
import com.SenaiCommunity.BackEnd.Exception.ConteudoImproprioException;
import com.SenaiCommunity.BackEnd.Service.ComentarioService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;
import java.util.NoSuchElementException;

@Controller
@PreAuthorize("hasRole('ALUNO') or hasRole('PROFESSOR')")
public class ComentarioController {

    @Autowired
    private ComentarioService comentarioService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // --- PARTE WEBSOCKET (para criar comentários em tempo real) ---
    @MessageMapping("/postagem/{postagemId}/comentar")
    public void novoComentario(@DestinationVariable Long postagemId,
                               @Payload ComentarioEntradaDTO comentarioDTO,
                               Principal principal) {

        try {
            ComentarioSaidaDTO novoComentario = comentarioService.criarComentario(postagemId, principal.getName(), comentarioDTO);
            messagingTemplate.convertAndSend("/topic/postagem/" + postagemId + "/comentarios", novoComentario);

            if (comentarioDTO.getParentId() != null) {
                Map<String, Object> payload = Map.of(
                        "tipo", "nova_resposta",
                        "comentario", novoComentario,
                        "postagemId", postagemId
                );
                messagingTemplate.convertAndSend("/topic/comentario/" + comentarioDTO.getParentId() + "/respostas", payload);
            }

            // Tópico público (feed)
            Map<String, Object> payloadPublico = Map.of("tipo", "novo_comentario", "id", postagemId);
            messagingTemplate.convertAndSend("/topic/publico", payloadPublico);

        } catch (ConteudoImproprioException e) {
            String destination = "/user/" + principal.getName() + "/queue/errors";
            messagingTemplate.convertAndSendToUser(principal.getName(), "/queue/errors", e.getMessage());

        } catch (Exception e) {
            String destination = "/user/" + principal.getName() + "/queue/errors";
            messagingTemplate.convertAndSendToUser(principal.getName(), "/queue/errors", "Não foi possível enviar seu comentário.");
        }
    }

    // --- PARTE REST (endpoints para editar/excluir) ---
    @RestController
    @RequestMapping("/comentarios")
    public static class ComentarioRestController {

        @Autowired
        private ComentarioService comentarioService;

        @Autowired
        private SimpMessagingTemplate messagingTemplate;

        @PutMapping("/{id}/destacar")
        public ResponseEntity<?> destacarComentario(@PathVariable Long id, Principal principal) {
            try {
                ComentarioSaidaDTO comentarioAtualizado = comentarioService.destacarComentario(id, principal.getName());
                Long postagemId = comentarioAtualizado.getPostagemId();

                // Notifica o tópico da postagem e o tópico específico do comentário
                Map<String, Object> payload = Map.of(
                        "tipo", "destaque",
                        "comentario", comentarioAtualizado,
                        "postagemId", postagemId
                );
                messagingTemplate.convertAndSend("/topic/postagem/" + postagemId + "/comentarios", payload);

                // Notifica o feed público que a postagem foi atualizada
                Map<String, Object> payloadPublico = Map.of("tipo", "destaque_comentario", "id", postagemId);
                messagingTemplate.convertAndSend("/topic/publico", payloadPublico);

                return ResponseEntity.ok(comentarioAtualizado);
            } catch (SecurityException e) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
            } catch (EntityNotFoundException | NoSuchElementException e) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
            }
        }

        @PutMapping("/{id}")
        public ResponseEntity<?> editarComentario(@PathVariable Long id,
                                                  @RequestBody ComentarioEntradaDTO dto,
                                                  Principal principal) {
            try {
                ComentarioSaidaDTO comentarioAtualizado = comentarioService.editarComentario(id, principal.getName(),dto.getConteudo());
                Long postagemId = comentarioAtualizado.getPostagemId();

                // Notifica o tópico da postagem e o tópico específico do comentário
                Map<String, Object> payload = Map.of(
                        "tipo", "edicao",
                        "comentario", comentarioAtualizado,
                        "postagemId", postagemId
                );
                messagingTemplate.convertAndSend("/topic/postagem/" + postagemId + "/comentarios", payload);
                messagingTemplate.convertAndSend("/topic/comentario/" + id + "/respostas", payload);

                // Notifica o feed público que a postagem foi atualizada
                Map<String, Object> payloadPublico = Map.of("tipo", "edicao_comentario", "id", postagemId);
                messagingTemplate.convertAndSend("/topic/publico", payloadPublico);

                return ResponseEntity.ok(comentarioAtualizado);
            } catch (SecurityException e) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
            } catch (EntityNotFoundException | NoSuchElementException e) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
            }
        }

        @DeleteMapping("/{id}")
        public ResponseEntity<?> excluirComentario(@PathVariable Long id, Principal principal) {
            try {
                ComentarioSaidaDTO comentarioExcluido = comentarioService.excluirComentario(id, principal.getName());
                Long postagemId = comentarioExcluido.getPostagemId();

                Map<String, Object> payload = Map.of(
                        "tipo", "remocao",
                        "id", id,
                        "postagemId", postagemId
                );

                // Notifica o tópico da postagem e o tópico específico do comentário
                messagingTemplate.convertAndSend("/topic/postagem/" + postagemId + "/comentarios", payload);
                messagingTemplate.convertAndSend("/topic/comentario/" + id + "/respostas", payload);

                // Notifica o feed público que a postagem foi atualizada
                Map<String, Object> payloadPublico = Map.of("tipo", "remocao_comentario", "id", postagemId);
                messagingTemplate.convertAndSend("/topic/publico", payloadPublico);

                return ResponseEntity.ok().build();
            } catch (SecurityException e) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
            } catch (EntityNotFoundException | NoSuchElementException e) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
            }
        }
    }
}