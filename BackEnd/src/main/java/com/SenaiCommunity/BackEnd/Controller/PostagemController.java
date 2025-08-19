package com.SenaiCommunity.BackEnd.Controller;

import com.SenaiCommunity.BackEnd.DTO.PostagemEntradaDTO;
import com.SenaiCommunity.BackEnd.DTO.PostagemSaidaDTO;
import com.SenaiCommunity.BackEnd.Service.PostagemService;
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

    // ✅ MÉTODO ATUALIZADO PARA USAR @RequestPart COM DTO E ARQUIVOS
    @PostMapping("/upload-mensagem")
    public ResponseEntity<PostagemSaidaDTO> uploadComMensagem(
            @RequestPart("postagem") PostagemEntradaDTO dto,
            @RequestPart(value = "arquivos", required = false) List<MultipartFile> arquivos,
            Principal principal) throws IOException {

        PostagemSaidaDTO postagemCriada = postagemService.criarPostagem(principal.getName(), dto, arquivos);
        messagingTemplate.convertAndSend("/topic/publico", postagemCriada);
        return ResponseEntity.ok(postagemCriada);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> editarPostagem(@PathVariable Long id,
                                            @RequestBody String novoConteudo, Principal principal) {
        try {
            PostagemSaidaDTO dto = postagemService.editarPostagem(id, principal.getName(), novoConteudo);
            messagingTemplate.convertAndSend("/topic/publico", Map.of("tipo", "edicao", "postagem", dto));
            return ResponseEntity.ok(dto);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        }
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