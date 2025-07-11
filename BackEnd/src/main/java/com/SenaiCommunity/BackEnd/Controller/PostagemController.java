package com.SenaiCommunity.BackEnd.Controller;

import com.SenaiCommunity.BackEnd.DTO.PostagemSaidaDTO;
import com.SenaiCommunity.BackEnd.Service.ArquivoMidiaService;
import com.SenaiCommunity.BackEnd.Service.PostagemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.Principal;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/postagem")
public class PostagemController {

    @Autowired
    private PostagemService postagemService;

    @Autowired
    private ArquivoMidiaService midiaService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @PostMapping("/upload-mensagem")
    public ResponseEntity<PostagemSaidaDTO> uploadComMensagem(
            @RequestParam("mensagem") String mensagem,
            @RequestParam(value = "arquivos", required = false) List<MultipartFile> arquivos,
            Principal principal) throws IOException {

        PostagemSaidaDTO dto = postagemService.criarPostagem(principal.getName(), mensagem, arquivos);
        messagingTemplate.convertAndSend("/topic/publico", dto);
        return ResponseEntity.ok(dto);
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
