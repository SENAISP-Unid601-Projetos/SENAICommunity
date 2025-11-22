package com.SenaiCommunity.BackEnd.Controller;

import com.SenaiCommunity.BackEnd.DTO.ComentarioEntradaDTO;
import com.SenaiCommunity.BackEnd.DTO.ComentarioSaidaDTO;
import com.SenaiCommunity.BackEnd.DTO.PostagemSaidaDTO; // ✅ IMPORTAR
import com.SenaiCommunity.BackEnd.Service.ComentarioService;
 import com.SenaiCommunity.BackEnd.Service.PostagemService; // ❌ NÃO É MAIS NECESSÁRIO AQUI
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
 import org.springframework.messaging.handler.annotation.SendTo; // ❌ NÃO É MAIS NECESSÁRIO
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

    // ❌ PostagemService NÃO É MAIS NECESSÁRIO AQUI
    // @Autowired
    // private PostagemService postagemService;

    // --- PARTE WEBSOCKET (para criar comentários em tempo real) ---
    @MessageMapping("/postagem/{postagemId}/comentar")
    // ❌ @SendTo FOI REMOVIDO
    public void novoComentario(@DestinationVariable Long postagemId,
                               @Payload ComentarioEntradaDTO comentarioDTO,
                               Principal principal) {

        // 1. ✅ AGORA RETORNA O POST COMPLETO E ATUALIZADO
        PostagemSaidaDTO postAtualizado = comentarioService.criarComentario(postagemId, principal.getName(), comentarioDTO);

        // 2. Lógica para notificar respostas (se for uma resposta)
        if (comentarioDTO.getParentId() != null) {
            // Tenta encontrar o comentário que acabou de ser criado
            ComentarioSaidaDTO novoComentario = postAtualizado.getComentarios().stream()
                    .filter(c -> c.getConteudo().equals(comentarioDTO.getConteudo()) && c.getAutorId().toString().equals(principal.getName())) // Lógica simples de "achar"
                    .findFirst()
                    .orElse(null); // Pode falhar se o texto for idêntico, mas é o suficiente

            if(novoComentario != null) {
                Map<String, Object> payload = Map.of(
                        "tipo", "nova_resposta",
                        "comentario", novoComentario,
                        "postagemId", postagemId
                );
                messagingTemplate.convertAndSend("/topic/comentario/" + comentarioDTO.getParentId() + "/respostas", payload);
            }
        }

        // 3. ✅ ENVIA O POST COMPLETO PARA O FEED PÚBLICO
        messagingTemplate.convertAndSend("/topic/publico", postAtualizado);
    }

    // --- PARTE REST (endpoints para editar/excluir) ---
    @RestController
    @RequestMapping("/comentarios")
    @PreAuthorize("hasRole('ALUNO') or hasRole('PROFESSOR')")
    public static class ComentarioRestController {

        @Autowired
        private ComentarioService comentarioService;

        // ❌ PostagemService NÃO É MAIS NECESSÁRIO AQUI
        // @Autowired
        // private PostagemService postagemService;

        @Autowired
        private SimpMessagingTemplate messagingTemplate;

        @PutMapping("/{id}/destacar")
        public ResponseEntity<?> destacarComentario(@PathVariable Long id, Principal principal) {
            try {
                // ✅ AGORA RETORNA O POST COMPLETO E ATUALIZADO
                PostagemSaidaDTO postAtualizado = comentarioService.destacarComentario(id, principal.getName());

                // Envia o post completo para o feed público
                messagingTemplate.convertAndSend("/topic/publico", postAtualizado);

                // Retorna apenas o comentário que foi destacado (para consistência, se necessário)
                ComentarioSaidaDTO comentarioDestacado = postAtualizado.getComentarios().stream()
                        .filter(ComentarioSaidaDTO::isDestacado)
                        .findFirst()
                        .orElse(null);

                return ResponseEntity.ok(comentarioDestacado);
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
                // ✅ AGORA RETORNA O POST COMPLETO E ATUALIZADO
                PostagemSaidaDTO postAtualizado = comentarioService.editarComentario(id, principal.getName(),dto.getConteudo());

                // Envia o post completo para o feed público
                messagingTemplate.convertAndSend("/topic/publico", postAtualizado);

                // Retorna apenas o comentário editado (para consistência, se necessário)
                ComentarioSaidaDTO comentarioEditado = postAtualizado.getComentarios().stream()
                        .filter(c -> c.getId().equals(id))
                        .findFirst()
                        .orElse(null);

                return ResponseEntity.ok(comentarioEditado);
            } catch (SecurityException e) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
            } catch (EntityNotFoundException | NoSuchElementException e) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
            }
        }

        @DeleteMapping("/{id}")
        public ResponseEntity<?> excluirComentario(@PathVariable Long id, Principal principal) {
            try {
                // ✅ AGORA RETORNA O POST COMPLETO E ATUALIZADO (sem o comentário)
                PostagemSaidaDTO postAtualizado = comentarioService.excluirComentario(id, principal.getName());

                // Envia o post completo para o feed público
                messagingTemplate.convertAndSend("/topic/publico", postAtualizado);

                return ResponseEntity.ok().build();
            } catch (SecurityException e) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
            } catch (EntityNotFoundException | NoSuchElementException e) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
            }
        }
    }
}