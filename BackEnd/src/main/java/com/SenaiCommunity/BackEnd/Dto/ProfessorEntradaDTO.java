package com.SenaiCommunity.BackEnd.DTO;

import lombok.Data;
import org.springframework.web.bind.annotation.RequestParam;

import java.time.LocalDate;

@Data
public class ProfessorEntradaDTO {

    private String nome;
    private String email;
    private String senha;
    private String fotoPerfil;
    private String formacao;
    private String codigoSn;
    private LocalDate dataNascimento;
}
