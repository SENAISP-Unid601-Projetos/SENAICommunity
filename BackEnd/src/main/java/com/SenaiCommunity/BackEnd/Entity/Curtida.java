package com.SenaiCommunity.BackEnd.Entity;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Curtida {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Quem curtiu
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    // O que foi curtido (PODE SER UMA POSTAGEM...)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "postagem_id") // Nullable pois pode ser um comentário
    private Postagem postagem;

    // (...OU UM COMENTÁRIO)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "comentario_id") // Nullable pois pode ser uma postagem
    private Comentario comentario;
}