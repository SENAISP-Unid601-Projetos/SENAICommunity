package com.SenaiCommunity.BackEnd.DTO;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ComentarioSaidaDTO {
    private Long id;
    private String conteudo;
    private LocalDateTime dataCriacao;
    private Long autorId;
    private String nomeAutor;
    private Long postagemId;
}