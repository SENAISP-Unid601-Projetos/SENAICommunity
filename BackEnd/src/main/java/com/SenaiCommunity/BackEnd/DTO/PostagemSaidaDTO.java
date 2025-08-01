package com.SenaiCommunity.BackEnd.DTO;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class PostagemSaidaDTO {

    private Long id;
    private String conteudo;
    private LocalDateTime dataCriacao;
    private Long autorId;
    private String nomeAutor;
    private List<String> urlsMidia;

}
