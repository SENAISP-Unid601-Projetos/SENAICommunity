package com.SenaiCommunity.BackEnd.Dto;

import com.SenaiCommunity.BackEnd.Entity.Postagem;
import com.SenaiCommunity.BackEnd.Entity.Usuario;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ComentarioDto {
    private Long id;

    private String conteudo;

    private LocalDateTime dataComentario;

    private Usuario autor;

    private Postagem postagem;
}
