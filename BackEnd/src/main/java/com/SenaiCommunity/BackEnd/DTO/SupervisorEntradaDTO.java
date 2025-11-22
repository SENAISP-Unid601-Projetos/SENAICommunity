package com.SenaiCommunity.BackEnd.DTO;

import lombok.Data;
import java.time.LocalDate;

@Data
public class SupervisorEntradaDTO {
    private String nome;
    private String email;
    private String senha;
    private LocalDate dataNascimento;
}