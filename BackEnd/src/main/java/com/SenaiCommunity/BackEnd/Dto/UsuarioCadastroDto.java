package com.SenaiCommunity.BackEnd.Dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioCadastroDto {

    private String nomeCompleto;
    private String email;
    private String senha;
    private String fotoPerfil;

    private String codigoSn;
    private String matricula;
}

