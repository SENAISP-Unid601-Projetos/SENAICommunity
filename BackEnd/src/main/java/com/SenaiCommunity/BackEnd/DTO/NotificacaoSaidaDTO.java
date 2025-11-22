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

    // --- CAMPOS ADICIONADOS ---
    private Long remetenteId;
    private String remetenteNome;
    private String remetenteFotoUrl; // URL da foto de quem originou
    // --- FIM DA ADIÇÃO ---


    // (O método fromEntity() foi removido para simplificar, já que o Service usa o Builder)
}