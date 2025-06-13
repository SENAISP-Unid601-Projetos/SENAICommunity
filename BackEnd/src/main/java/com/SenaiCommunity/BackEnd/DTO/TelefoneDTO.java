package com.SenaiCommunity.BackEnd.Dto;

import lombok.Data;

@Data
public class TelefoneDTO {
    private Long id;
    private String numero;
    private String tipo;
    private Long usuarioId;
}
