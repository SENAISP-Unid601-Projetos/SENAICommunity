package com.SenaiCommunity.BackEnd.Entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
public class Postagem{

    @Id
    @GeneratedValue
    private Long id;

    @ManyToOne
    private Usuario autor;

    private String conteudo;

    private LocalDateTime dataPostagem = LocalDateTime.now();

    @Transient
    private String autorUsername;
}

