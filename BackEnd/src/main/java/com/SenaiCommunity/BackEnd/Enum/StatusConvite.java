package com.SenaiCommunity.BackEnd.Enum;

import lombok.Data;

public enum StatusConvite {
    PENDENTE("Pendente"),
    ACEITO("Aceito"),
    RECUSADO("Recusado");

    private final String descricao;

    StatusConvite(String descricao) {
        this.descricao = descricao;
    }
}
