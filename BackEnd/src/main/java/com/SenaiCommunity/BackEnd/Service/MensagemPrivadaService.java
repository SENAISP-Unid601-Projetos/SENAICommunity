package com.SenaiCommunity.BackEnd.Service;


import com.SenaiCommunity.BackEnd.DTO.MensagemPrivadaDTO;
import com.SenaiCommunity.BackEnd.Entity.*;
import com.SenaiCommunity.BackEnd.Repository.MensagemPrivadaRepository;
import com.SenaiCommunity.BackEnd.Repository.UsuarioRepository;
import com.SenaiCommunity.BackEnd.Repository.ChatPrivadoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MensagemPrivadaService {

    @Autowired
    private MensagemPrivadaRepository repository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private ChatPrivadoRepository chatPrivadoRepository;

    public MensagemPrivadaDTO enviarMensagem(MensagemPrivadaDTO dto) {
        Usuario remetente = usuarioRepository.findById(dto.getRemetenteId()).orElseThrow();
        Usuario destinatario = usuarioRepository.findById(dto.getDestinatarioId()).orElseThrow();
        ChatPrivado chat = chatPrivadoRepository.findById(dto.getChatId()).orElseThrow();

        MensagemPrivada mensagem = new MensagemPrivada();
        mensagem.setRemetente(remetente);
        mensagem.setDestinatario(destinatario);
        mensagem.setConteudo(dto.getConteudo());
        mensagem.setChat(chat);
        mensagem.setDataHora(LocalDateTime.now());

        MensagemPrivada salva = repository.save(mensagem);
        dto.setId(salva.getId());
        dto.setDataHora(salva.getDataHora());
        return dto;
    }

    public List<MensagemPrivadaDTO> listarPorChat(Long chatId) {
        ChatPrivado chat = chatPrivadoRepository.findById(chatId).orElseThrow();
        List<MensagemPrivada> mensagens = repository.findByChat(chat);
        return mensagens.stream().map(this::toDTO).collect(Collectors.toList());
    }

    private MensagemPrivadaDTO toDTO(MensagemPrivada msg) {
        MensagemPrivadaDTO dto = new MensagemPrivadaDTO();
        dto.setId(msg.getId());
        dto.setConteudo(msg.getConteudo());
        dto.setRemetenteId(msg.getRemetente().getId());
        dto.setDestinatarioId(msg.getDestinatario().getId());
        dto.setDataHora(msg.getDataHora());
        dto.setChatId(msg.getChat().getId());
        return dto;
    }
}

