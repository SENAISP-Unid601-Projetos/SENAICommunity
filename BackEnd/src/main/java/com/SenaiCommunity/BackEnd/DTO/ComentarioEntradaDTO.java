package com.SenaiCommunity.BackEnd.DTO;
import lombok.Data;

@Data
public class ComentarioEntradaDTO {
    private String conteudo;
    //CAMPO para identificar se é uma resposta
    private Long parentId;
}