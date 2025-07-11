package com.SenaiCommunity.BackEnd.DTO;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class PostagemEntradaDTO {
    private String conteudo;
    private Long projetoId;
    private List<String> urlsMidia;


}
