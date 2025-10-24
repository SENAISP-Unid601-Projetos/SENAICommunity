package com.SenaiCommunity.BackEnd.DTO;

import lombok.Data;
import java.time.LocalDate;

@Data
public class UsuarioAtualizacaoDTO {

    private String nome;
    private String senha;
    private String bio;
    private LocalDate dataNascimento;
}