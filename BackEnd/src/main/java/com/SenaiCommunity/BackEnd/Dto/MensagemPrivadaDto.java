package com.SenaiCommunity.BackEnd.Dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class MensagemPrivadaDto {
    private Long id;
    private Long remetenteId;
    private Long destinatarioId;
    private Long chatId;
    private String conteudo;
    private LocalDateTime dataHora;
}
