package com.SenaiCommunity.BackEnd.DTO;

import lombok.Data;

import java.util.List;

@Data
public class PostagemMensagemDTO {
    private String conteudo;
    private List<String> arquivosUrl; // URLs de imagem/vídeo/áudio
}
