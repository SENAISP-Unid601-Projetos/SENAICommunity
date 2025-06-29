package com.SenaiCommunity.BackEnd.Controller;

import com.SenaiCommunity.BackEnd.DTO.PostagemSaidaDTO;
import com.SenaiCommunity.BackEnd.Entity.ArquivoMidia;
import com.SenaiCommunity.BackEnd.Entity.Postagem;
import com.SenaiCommunity.BackEnd.Service.ArquivoMidiaService;
import com.SenaiCommunity.BackEnd.Service.ChatService;
import org.apache.commons.io.FilenameUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.Principal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/postagem")
public class PostagemController {

    @Autowired
    private ChatService chatService;

    @Autowired
    private ArquivoMidiaService midiaService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @PostMapping("/upload-mensagem")
    public ResponseEntity<PostagemSaidaDTO> uploadComMensagem(
            @RequestParam("mensagem") String mensagem,
            @RequestParam(value = "arquivos", required = false) List<MultipartFile> arquivos,
            Principal principal) throws IOException {

        List<String> urls = new ArrayList<>();
        if (arquivos != null) {
            for (MultipartFile file : arquivos) {
                String url = midiaService.upload(file);
                urls.add(url);
            }
        }

        Postagem postagem = new Postagem();
        postagem.setAutorUsername(principal.getName());
        postagem.setConteudo(mensagem);
        postagem.setDataPostagem(LocalDateTime.now());

        Postagem salva = chatService.salvarPostagem(postagem, urls);

        PostagemSaidaDTO dto = chatService.toDTO(salva);
        messagingTemplate.convertAndSend("/topic/publico", dto);
        return ResponseEntity.ok(dto);

    }
}
