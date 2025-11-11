package com.SenaiCommunity.BackEnd.DTO;

import com.SenaiCommunity.BackEnd.Entity.Notificacao;
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
    private Long idReferenciaSecundaria;

    // Método de conversão estático para facilitar a criação a partir da entidade
    public static NotificacaoSaidaDTO fromEntity(Notificacao notificacao) {
        return new NotificacaoSaidaDTO(
                notificacao.getId(),
                notificacao.getMensagem(),
                notificacao.getDataCriacao(),
                notificacao.isLida(),
                notificacao.getTipo(),
                notificacao.getIdReferencia(),
                notificacao.getIdReferenciaSecundaria()
        );
    }


}