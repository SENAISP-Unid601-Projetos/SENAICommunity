package com.SenaiCommunity.BackEnd.DTO;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class ComentarioSaidaDTO {
    private Long id;
    private String conteudo;
    private LocalDateTime dataCriacao;
    private Long autorId;
    private String nomeAutor;
    private Long postagemId;
    private Long parentId;
    private boolean destacado;
    private String replyingToName; // Nome do autor do comentário pai
    private int totalCurtidas;
    private boolean curtidoPeloUsuario;
}