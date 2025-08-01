package com.SenaiCommunity.BackEnd.Entity;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
@Builder
public class MensagemGrupo {

    @Id
    @GeneratedValue
    private Long id;

    @ManyToOne
    private Usuario autor;

    @ManyToOne
    private Projeto projeto;

    private String conteudo;

    private LocalDateTime dataEnvio = LocalDateTime.now();

    @Transient // não persistido diretamente no banco
    private String autorUsername;
}

