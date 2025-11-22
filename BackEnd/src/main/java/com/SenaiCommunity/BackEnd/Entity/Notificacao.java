package com.SenaiCommunity.BackEnd.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Notificacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "destinatario_id", nullable = false)
    private Usuario destinatario;

    // --- CAMPO ADICIONADO ---
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "remetente_id") // Pode ser nulo (notificação do sistema)
    private Usuario remetente;
    // --- FIM DA ADIÇÃO ---

    private String mensagem;

    @Builder.Default // Garante que a data seja definida
    private LocalDateTime dataCriacao = LocalDateTime.now();

    @Builder.Default // Garante que 'lida' seja false
    private boolean lida = false;

    private String tipo; // Ex: "CONVITE_PROJETO", "PEDIDO_AMIZADE", "GERAL"
    private Long idReferencia; // ID da entidade relacionada (Projeto, Amizade, etc.)

}