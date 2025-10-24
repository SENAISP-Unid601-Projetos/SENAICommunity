package com.SenaiCommunity.BackEnd.DTO;

import com.SenaiCommunity.BackEnd.Entity.Usuario;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SolicitacaoEnviadaDTO {
    private Long idAmizade; // ID da amizade para poder cancelar
    private Long idSolicitado;
    private String nomeSolicitado;
    private String fotoPerfilSolicitado;
    private LocalDateTime dataSolicitacao;
}