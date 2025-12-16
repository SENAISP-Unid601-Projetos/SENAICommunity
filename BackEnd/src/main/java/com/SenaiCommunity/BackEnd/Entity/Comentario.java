package com.SenaiCommunity.BackEnd.Entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Comentario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String conteudo;

    @Builder.Default
    private LocalDateTime dataCriacao = LocalDateTime.now();

    // CAMPO para destacar o comentário
    private boolean destacado = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "autor_id", nullable = false)
    @ToString.Exclude
    private Usuario autor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "postagem_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude // CORREÇÃO: Evita loop infinito com Postagem
    private Postagem postagem;

    //RELACIONAMENTO PARA RESPOSTAS (Self-referencing)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude // CORREÇÃO: Evita loop infinito com Pai
    private Comentario parent;

    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude // CORREÇÃO: Evita loop infinito com Filhos
    private List<Comentario> replies = new ArrayList<>();

    @OneToMany(mappedBy = "comentario", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude // CORREÇÃO: Evita loop infinito com Curtidas
    private Set<Curtida> curtidas;

}