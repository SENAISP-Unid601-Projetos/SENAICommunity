package com.SenaiCommunity.BackEnd.DTO;

import lombok.Data;

@Data
public class AlunoEntradaDTO {

    private String nome;
    private String email;
    private String senha;
    private String fotoPerfil;

    private String curso;
    private String periodo;
}
