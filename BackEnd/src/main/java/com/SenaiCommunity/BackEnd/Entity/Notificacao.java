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

    @ManyToOne
    @JoinColumn(name = "destinatario_id", nullable = false)
    private Usuario destinatario;

    private String mensagem;
    private LocalDateTime dataCriacao;
    private boolean lida = false;
    private String tipo; // Ex: "PEDIDO_AMIZADE", "GERAL"
    private Long idReferencia; // Ex: o ID da Amizade
    private Long idReferenciaSecundaria;

}