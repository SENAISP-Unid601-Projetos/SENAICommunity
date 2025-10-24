package com.SenaiCommunity.BackEnd.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificacaoSaidaDTO {

    private Long id;
    private String mensagem;
    private LocalDateTime dataCriacao;
    private boolean lida;
    private String tipo;
    private Long idReferencia;
    private Long atorId;        // ID de quem causou a notificação (null se for do sistema)
    private String atorNome;    // Nome de quem causou (ex: "Sistema" ou "Nome do Usuário")
    private String urlFotoAtor; // URL da foto de perfil de quem causou

}