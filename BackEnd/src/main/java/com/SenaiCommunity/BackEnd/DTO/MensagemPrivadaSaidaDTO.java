package com.SenaiCommunity.BackEnd.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MensagemPrivadaSaidaDTO {
    private Long id;
    private Long remetenteId;
    private String nomeRemetente;
    private String remetenteEmail;
    private Long destinatarioId;
    private String nomeDestinatario;
    private String destinatarioEmail;
    private String conteudo;
    private LocalDateTime dataEnvio;
    // ✅ NOVO CAMPO
    private LocalDateTime dataEdicao;
}