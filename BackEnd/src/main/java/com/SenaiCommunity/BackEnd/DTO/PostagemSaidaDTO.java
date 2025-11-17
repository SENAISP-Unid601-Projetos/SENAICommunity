package com.SenaiCommunity.BackEnd.DTO;

import jakarta.persistence.Lob;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class PostagemSaidaDTO {

    private Long id;
    @Lob
    private String conteudo;
    private LocalDateTime dataCriacao;
    private Long autorId;
    private String nomeAutor;
    private List<String> urlsMidia;
    private String urlFotoAutor;
    private List<ComentarioSaidaDTO> comentarios;
    private int totalCurtidas;
    private boolean curtidoPeloUsuario;
}
