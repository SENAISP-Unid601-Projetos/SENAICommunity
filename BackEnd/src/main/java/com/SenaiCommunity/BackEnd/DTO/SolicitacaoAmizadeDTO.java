package com.SenaiCommunity.BackEnd.DTO;

import com.SenaiCommunity.BackEnd.Entity.Amizade;
import com.SenaiCommunity.BackEnd.Entity.Usuario;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SolicitacaoAmizadeDTO {

    private Long idAmizade; // O ID da solicitação, para poder aceitar/recusar
    private Long idSolicitante;
    private String nomeSolicitante;
    private String fotoPerfilSolicitante;
    private LocalDateTime dataSolicitacao;

    // Método de conversão para facilitar a criação a partir da entidade Amizade
    public static SolicitacaoAmizadeDTO fromEntity(Amizade amizade) {
        Usuario solicitante = amizade.getSolicitante();
        return new SolicitacaoAmizadeDTO(
                amizade.getId(),
                solicitante.getId(),
                solicitante.getNome(),
                solicitante.getFotoPerfil(),
                amizade.getDataSolicitacao()
        );
    }
}