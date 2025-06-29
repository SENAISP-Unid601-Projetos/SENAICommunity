package com.SenaiCommunity.BackEnd.DTO;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class PostagemSaidaDTO {
    private String autor;
    private String conteudo;
    private LocalDateTime dataPostagem;
    private List<ArquivoMidiaDTO> arquivos;
}
