package com.SenaiCommunity.BackEnd.DTO;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class ConversaResumoDTO {

    private Long outroUsuarioId;
    private String nomeOutroUsuario;
    private String emailOutroUsuario;
    private String fotoPerfilOutroUsuario;

    // Informações da *última* mensagem
    private Long ultimaMensagemId;
    private String conteudoUltimaMensagem;
    private LocalDateTime dataEnvioUltimaMensagem;
    private Long remetenteUltimaMensagemId;
}