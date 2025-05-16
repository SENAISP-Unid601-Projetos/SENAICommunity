package com.SenaiCommunity.BackEnd.Controller;


import com.SenaiCommunity.BackEnd.Dto.MensagemPrivadaDto;
import com.SenaiCommunity.BackEnd.Service.MensagemPrivadaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/mensagens")
public class MensagemPrivadaController {

    @Autowired
    private MensagemPrivadaService service;

    @PostMapping
    public MensagemPrivadaDto enviar(@RequestBody MensagemPrivadaDto dto) {
        return service.enviarMensagem(dto);
    }

    @GetMapping("/chat/{chatId}")
    public List<MensagemPrivadaDto> listarMensagens(@PathVariable Long chatId) {
        return service.listarPorChat(chatId);
    }

}

