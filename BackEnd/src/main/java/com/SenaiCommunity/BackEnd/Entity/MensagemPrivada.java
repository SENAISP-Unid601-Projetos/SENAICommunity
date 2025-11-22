package com.SenaiCommunity.BackEnd.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MensagemPrivada {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // ✅ CRÍTICO PARA O AUTO_INCREMENT NO MYSQL
    private Long id;

    @ManyToOne
    @JoinColumn(name = "remetente_id")
    private Usuario remetente;

    @ManyToOne
    @JoinColumn(name = "destinatario_id")
    private Usuario destinatario;

    @Column(columnDefinition = "TEXT")
    private String conteudo;

    private LocalDateTime dataEnvio;

    private LocalDateTime dataEdicao;
}