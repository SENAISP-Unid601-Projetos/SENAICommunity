package com.SenaiCommunity.BackEnd.DTO;

import lombok.Data;

@Data
public class ProfessorEntradaDTO {

    private String nome;
    private String email;
    private String senha;
    private String fotoPerfil;

    private String formacao;
    private String areaAtuacao;
    private String codigoSn;
}
