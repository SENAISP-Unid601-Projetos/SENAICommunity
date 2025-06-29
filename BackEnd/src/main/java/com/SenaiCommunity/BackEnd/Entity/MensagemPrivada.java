package com.SenaiCommunity.BackEnd.Entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
public class MensagemPrivada {

    @Id
    @GeneratedValue
    private Long id;

    @ManyToOne
    private Usuario remetente;

    @ManyToOne
    private Usuario destinatario;

    private String conteudo;

    private LocalDateTime dataEnvio = LocalDateTime.now();

    @Transient
    private String remetenteUsername;
}
