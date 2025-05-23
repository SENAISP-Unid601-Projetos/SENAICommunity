package com.SenaiCommunity.BackEnd.Dto;

import lombok.Data;

import java.util.Date;
import java.util.List;

@Data
public class ProjetoDTO {
    private Long id;
    private String titulo;
    private String descricao;
    private Date dataInicio;
    private Date dataEntrega;
    private String status; // PLANEJADO, EM_ANDAMENTO, CONCLUIDO

    private Long autorId; // id do usuário autor

    private List<Long> professorIds; // lista de ids dos professores

    private List<Long> alunoIds; // lista de ids dos alunos
}
