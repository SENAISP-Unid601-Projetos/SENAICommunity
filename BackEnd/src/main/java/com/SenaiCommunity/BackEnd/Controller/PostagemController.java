package com.SenaiCommunity.BackEnd.Controller;

import com.SenaiCommunity.BackEnd.DTO.PostagemEntradaDTO;
import com.SenaiCommunity.BackEnd.DTO.PostagemSaidaDTO;
import com.SenaiCommunity.BackEnd.Service.PostagemService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/postagem")
@PreAuthorize("hasRole('ALUNO') or hasRole('PROFESSOR')")
public class PostagemController {

    @Autowired
    private PostagemService postagemService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

<<<<<<< HEAD
    //  MÉTODO USA @RequestPart COM DTO E ARQUIVOS
=======
>>>>>>> back
    @PostMapping("/upload-mensagem")
    public ResponseEntity<PostagemSaidaDTO> uploadComMensagem(
            @RequestPart("postagem") PostagemEntradaDTO dto,
            @RequestPart(value = "arquivos", required = false) List<MultipartFile> arquivos,
            Principal principal) throws IOException {

        PostagemSaidaDTO postagemCriada = postagemService.criarPostagem(principal.getName(), dto, arquivos);
<<<<<<< HEAD
=======

        // Garantir que os comentários venham ordenados (destacados primeiro, depois por data)
        postagemCriada = postagemService.ordenarComentarios(postagemCriada);

>>>>>>> back
        messagingTemplate.convertAndSend("/topic/publico", postagemCriada);
        return ResponseEntity.ok(postagemCriada);
    }

<<<<<<< HEAD
    @PutMapping(path = "/{id}", consumes = "multipart/form-data") // <- Muda para multipart
    public ResponseEntity<?> editarPostagem(
            @PathVariable Long id,
            @RequestPart("postagem") PostagemEntradaDTO dto, // <- Recebe o DTO
            @RequestPart(value = "arquivos", required = false) List<MultipartFile> novosArquivos, // <- Recebe novos arquivos
            Principal principal) {
        try {
            PostagemSaidaDTO postagemAtualizada = postagemService.editarPostagem(id, principal.getName(), dto, novosArquivos);
            // Notifica via WebSocket sobre a edição
            messagingTemplate.convertAndSend("/topic/publico", Map.of("tipo", "edicao", "postagem", postagemAtualizada));
=======
    @PutMapping(path = "/{id}", consumes = "multipart/form-data")
    public ResponseEntity<?> editarPostagem(
            @PathVariable Long id,
            @RequestPart("postagem") PostagemEntradaDTO dto,
            @RequestPart(value = "arquivos", required = false) List<MultipartFile> novosArquivos,
            Principal principal) {
        try {
            PostagemSaidaDTO postagemAtualizada = postagemService.editarPostagem(id, principal.getName(), dto, novosArquivos);

            // Garantir que os comentários venham ordenados
            postagemAtualizada = postagemService.ordenarComentarios(postagemAtualizada);

            Map<String, Object> payload = Map.of("tipo", "edicao", "postagem", postagemAtualizada);
            messagingTemplate.convertAndSend("/topic/publico", payload);
>>>>>>> back
            return ResponseEntity.ok(postagemAtualizada);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

<<<<<<< HEAD
=======
    @GetMapping("/{id}")
    public ResponseEntity<PostagemSaidaDTO> buscarPostagemPorId(@PathVariable Long id) {
        try {
            PostagemSaidaDTO postagem = postagemService.buscarPostagemPorIdComComentarios(id);

            // Garantir que os comentários venham ordenados
            postagem = postagemService.ordenarComentarios(postagem);

            return ResponseEntity.ok(postagem);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

>>>>>>> back
    @DeleteMapping("/{id}")
    public ResponseEntity<?> excluirPostagem(@PathVariable Long id, Principal principal) {
        try {
            postagemService.excluirPostagem(id, principal.getName());
            messagingTemplate.convertAndSend("/topic/publico", Map.of("tipo", "remocao", "postagemId", id));
            return ResponseEntity.ok().build();
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
    }
}