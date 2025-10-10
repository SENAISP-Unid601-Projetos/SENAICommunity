package com.SenaiCommunity.BackEnd.DTO;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class MensagemProjetoSaidaDTO {

    private Long id;
    private String conteudo;
    private LocalDateTime dataEnvio;
    private Long projetoId;
    private Long autorId;
    private String nomeAutor;
    private String urlFotoAutor;
    private List<String> urlsMidia;
}