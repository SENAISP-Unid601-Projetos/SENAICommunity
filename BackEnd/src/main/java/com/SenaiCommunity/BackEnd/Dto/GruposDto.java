package com.SenaiCommunity.BackEnd.Dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDate;

@Data
public class GruposDto implements Serializable {
    private Long id;

    private String nome;
    private String descricao;
    private LocalDate dataCriacao;
}
