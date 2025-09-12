package com.SenaiCommunity.BackEnd.DTO;

import lombok.Data;
import java.util.List;

@Data
public class PostagemEntradaDTO {
    private String conteudo;
    private Long projetoId;
    private List<String> urlsParaRemover;
}
