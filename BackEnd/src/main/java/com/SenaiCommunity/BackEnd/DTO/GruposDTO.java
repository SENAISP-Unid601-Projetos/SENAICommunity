package com.SenaiCommunity.BackEnd.DTO;

import com.SenaiCommunity.BackEnd.Entity.Projeto;
import lombok.Data;

import java.time.LocalDate;

@Data
public class GruposDTO {
    private Long id;
    private String nome;
    private String descricao;
    private LocalDate dataCriacao;
    private Projeto projeto;
}
