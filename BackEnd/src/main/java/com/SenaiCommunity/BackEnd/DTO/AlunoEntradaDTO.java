package com.SenaiCommunity.BackEnd.DTO;

import lombok.Data;

import java.time.LocalDate;

@Data
public class AlunoEntradaDTO {

    private String nome;
    private String email;
    private String senha;
    private String fotoPerfil;
    private String curso;
    private String periodo;
    private LocalDate dataNascimento;



}
