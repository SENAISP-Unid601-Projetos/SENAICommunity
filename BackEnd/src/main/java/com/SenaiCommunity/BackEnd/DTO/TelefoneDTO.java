package com.SenaiCommunity.BackEnd.DTO;

import lombok.Data;

@Data
public class TelefoneDTO {
    private Long id;
    private String numero;
    private String tipo;
    private Long usuarioId;
}
