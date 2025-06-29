package com.SenaiCommunity.BackEnd.Controller;

import com.SenaiCommunity.BackEnd.Entity.MensagemGrupo;
import com.SenaiCommunity.BackEnd.Entity.MensagemPrivada;
import com.SenaiCommunity.BackEnd.Entity.Postagem;
import com.SenaiCommunity.BackEnd.Service.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.time.LocalDateTime;

@Controller
public class ChatController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private ChatService chatService;

    // 🔹 CHAT DE GRUPO
    @MessageMapping("/grupo/{projetoId}")
    @SendTo("/topic/grupo/{projetoId}")
    public MensagemGrupo enviarParaGrupo(@DestinationVariable Long projetoId,
                                         @Payload MensagemGrupo mensagem,
                                         Principal principal) {
        mensagem.setDataEnvio(LocalDateTime.now());
        mensagem.setAutorUsername(principal.getName());
        return chatService.salvarMensagemGrupo(mensagem, projetoId);
    }

    // 🔹 CHAT PRIVADO
    @MessageMapping("/privado/{destinatarioId}")
    public void enviarPrivado(@DestinationVariable Long destinatarioId,
                              @Payload MensagemPrivada mensagem,
                              Principal principal) {
        mensagem.setDataEnvio(LocalDateTime.now());
        mensagem.setRemetenteUsername(principal.getName());

        MensagemPrivada salva = chatService.salvarMensagemPrivada(mensagem, destinatarioId);

        messagingTemplate.convertAndSend("/queue/usuario/" + destinatarioId, salva);
    }

    // 🔹 POSTAGEM PÚBLICA
    @MessageMapping("/publico")
    @SendTo("/topic/publico")
    public Postagem postarPublico(@Payload Postagem postagem,
                                  Principal principal) {
        postagem.setAutorUsername(principal.getName());
        postagem.setDataPostagem(LocalDateTime.now());
        return chatService.salvarPostagem(postagem);
    }
}

