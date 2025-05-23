package com.SenaiCommunity.BackEnd.Dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import lombok.Data;

@Data
public class TelefoneDto {
    private Long id;
    private String numero;
    private String tipo;
    private Long usuarioId;
}
