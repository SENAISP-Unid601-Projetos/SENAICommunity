package com.SenaiCommunity.BackEnd.Entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor

@Table(name = "mensagem_privada", indexes = {
        @Index(name = "idx_msg_remetente", columnList = "remetente_id"),
        @Index(name = "idx_msg_destinatario", columnList = "destinatario_id")
})
public class MensagemPrivada {

    @Id
    @GeneratedValue
    private Long id;

    @ManyToOne
    @ToString.Exclude
    private Usuario remetente;

    @ManyToOne
    @ToString.Exclude
    private Usuario destinatario;

    @Lob
    private String conteudo;

    private LocalDateTime dataEnvio = LocalDateTime.now();

    @Transient // não persistido diretamente no banco
    private String remetenteUsername;

    @Column(nullable = false)
    private boolean lida = false;
}