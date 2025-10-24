package com.SenaiCommunity.BackEnd.DTO;

import lombok.Data;
import java.util.List;

@Data
public class MensagemProjetoEdicaoDTO {
    private String conteudo;
    private List<String> urlsParaRemover;
}