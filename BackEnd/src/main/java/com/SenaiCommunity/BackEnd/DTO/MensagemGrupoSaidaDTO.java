package com.SenaiCommunity.BackEnd.DTO;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class MensagemGrupoSaidaDTO {

    private Long id;
    private String conteudo;
    private LocalDateTime dataEnvio;
    private Long grupoId;
    private Long autorId;
    private String nomeAutor;

}
