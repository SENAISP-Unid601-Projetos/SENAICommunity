package com.SenaiCommunity.BackEnd.DTO;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class ProfessorSaidaDTO {

    private Long id;
    private String nome;
    private String email;
    private String fotoPerfil;

    private String formacao;
    private String codigoSn;

    private LocalDateTime dataCadastro;
    private String bio;
    private LocalDate dataNascimento;

    private List<Long> projetosOrientados;
}
