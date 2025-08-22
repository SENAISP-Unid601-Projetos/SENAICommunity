package com.SenaiCommunity.BackEnd.DTO;

import lombok.Data;

import java.time.LocalDate;

@Data
public class AvaliacoesDTO {
    private Long id;
    private Integer estrelas;
    private String comentario;
    private LocalDate dataAvaliacao;
    private Long usuarioId;
    private Long projetoId;
}
