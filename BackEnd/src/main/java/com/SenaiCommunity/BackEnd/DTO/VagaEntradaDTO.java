package com.SenaiCommunity.BackEnd.DTO;

import com.SenaiCommunity.BackEnd.Enum.*;
import lombok.Data;

@Data
public class VagaEntradaDTO {
    private String titulo;
    private String descricao;
    private String empresa;
    private LocalizacaoVaga localizacao;
    private NivelVaga nivel;
    private TipoContratacao tipoContratacao;
}