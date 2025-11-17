package com.SenaiCommunity.BackEnd.DTO;

import jakarta.persistence.Lob;
import lombok.Data;
import java.util.List;

@Data
public class PostagemEntradaDTO {
    @Lob
    private String conteudo;
    private Long projetoId;
    private List<String> urlsParaRemover;
}
