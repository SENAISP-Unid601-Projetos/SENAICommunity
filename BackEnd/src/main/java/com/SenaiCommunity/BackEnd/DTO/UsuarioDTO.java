package com.SenaiCommunity.BackEnd.DTO;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioDTO {
    private Long id;
    private String nomeCompleto;
    private String email;
    private String fotoPerfil;
    private Date dataNascimento;
    private String bio;
    private LocalDateTime dataCadastro;
    private String tipoUsuario; // "ALUNO" ou "PROFESSOR"
}

