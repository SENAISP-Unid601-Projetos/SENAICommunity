package com.SenaiCommunity.BackEnd.DTO;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class MensagemPrivadaDTO {
    private Long id;
    private Long remetenteId;
    private Long destinatarioId;
    private Long chatId;
    private String conteudo;
    private LocalDateTime dataHora;
}
