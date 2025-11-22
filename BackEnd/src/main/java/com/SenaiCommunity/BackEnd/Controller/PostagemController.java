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
import java.util.stream.Collectors;

@RestController
@RequestMapping("/postagem")
@PreAuthorize("hasRole('ALUNO') or hasRole('PROFESSOR') or hasRole('ADMIN')")
public class PostagemController {

    @Autowired
    private PostagemService postagemService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @PostMapping("/upload-mensagem")
    public ResponseEntity<?> uploadComMensagem( // ✅ Alterado para ResponseEntity<?>
                                                @RequestPart("postagem") PostagemEntradaDTO dto,
                                                @RequestPart(value = "arquivos", required = false) List<MultipartFile> arquivos,
                                                Principal principal) { // ✅ Removido 'throws IOException'

        // ✅ Bloco try-catch adicionado
        try {
            PostagemSaidaDTO postagemCriada = postagemService.criarPostagem(principal.getName(), dto, arquivos);

            // Garantir que os comentários venham ordenados (destacados primeiro, depois por data)
            postagemCriada = postagemService.ordenarComentarios(postagemCriada);

            messagingTemplate.convertAndSend("/topic/publico", postagemCriada);
            return ResponseEntity.ok(postagemCriada);

        } catch (RuntimeException e) {
            // Pega a exceção que o PostagemService lança (ex: falha no upload do Cloudinary)
            // e retorna uma mensagem de erro clara para o frontend
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Erro ao criar postagem (provável falha no upload): " + e.getMessage());
        }
    }

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
            return ResponseEntity.ok(postagemAtualizada);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

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
    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<List<PostagemSaidaDTO>> buscarPostagensPorUsuario(@PathVariable Long usuarioId) {
        // 1. Pede ao service (que você não enviou, mas sei que existe)
        //    para buscar as postagens usando o novo método do repositório.
        List<PostagemSaidaDTO> postagens = postagemService.buscarPostagensPorUsuario(usuarioId);

        // 2. É uma boa prática garantir que os comentários de CADA postagem
        //    também venham ordenados, assim como você faz nos outros endpoints.
        List<PostagemSaidaDTO> postagensOrdenadas = postagens.stream()
                .map(postagemService::ordenarComentarios)
                .collect(Collectors.toList());

        return ResponseEntity.ok(postagensOrdenadas);
    }

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