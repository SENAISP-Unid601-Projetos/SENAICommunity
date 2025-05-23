package com.SenaiCommunity.BackEnd.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioCadastroDTO {

    private String nomeCompleto;
    private String email;
    private String senha;
    private String fotoPerfil;

    private String codigoSn;
    private String matricula;
}

