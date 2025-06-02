package com.SenaiCommunity.BackEnd.DTO;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class AlunoSaidaDTO {

    private Long id;
    private String nome;
    private String email;
    private String fotoPerfil;

    private String curso;
    private String periodo;

    private LocalDateTime dataCadastro;
    private String bio;

    private List<Long> projetos;
}
