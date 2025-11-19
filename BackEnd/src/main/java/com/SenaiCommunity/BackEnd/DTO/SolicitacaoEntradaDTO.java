package com.SenaiCommunity.BackEnd.DTO;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class SolicitacaoEntradaDTO {
    private Long id;
    private Long usuarioId;
    private String usuarioNome;
    private String usuarioEmail;
    private String usuarioFoto;
    private LocalDateTime dataSolicitacao;
    private String status;
}