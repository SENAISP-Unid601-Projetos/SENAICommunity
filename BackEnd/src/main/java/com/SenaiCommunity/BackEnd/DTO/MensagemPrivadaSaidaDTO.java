package com.SenaiCommunity.BackEnd.DTO;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class MensagemPrivadaSaidaDTO {

    private Long id;
    private String conteudo;
    private LocalDateTime dataEnvio;
    private Long remetenteId;
    private String nomeRemetente;
    private Long destinatarioId;
    private String nomeDestinatario;
    private boolean lida = false;
    private String destinatarioEmail;
    private String remetenteEmail;
}
