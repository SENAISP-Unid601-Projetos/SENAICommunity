package com.SenaiCommunity.BackEnd.Controller;

import com.SenaiCommunity.BackEnd.Entity.MensagemGrupo;
import com.SenaiCommunity.BackEnd.Entity.MensagemPrivada;
import com.SenaiCommunity.BackEnd.Service.ArquivoMidiaService;
import com.SenaiCommunity.BackEnd.Service.MensagemGrupoService;
import com.SenaiCommunity.BackEnd.Service.MensagemPrivadaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.time.LocalDateTime;

@Controller
public class ChatController {





    @Autowired
    private MensagemGrupoService mensagemGrupoService;

    @Autowired
    private ArquivoMidiaService midiaService;



}

