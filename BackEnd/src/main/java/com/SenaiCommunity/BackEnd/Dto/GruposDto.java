package com.SenaiCommunity.BackEnd.Dto;

import com.SenaiCommunity.BackEnd.Entity.Projeto;
import lombok.Data;

import java.time.LocalDate;

@Data
public class GruposDto {
    private Long id;
    private String nome;
    private String descricao;
    private LocalDate dataCriacao;
    private Projeto projeto;
}
