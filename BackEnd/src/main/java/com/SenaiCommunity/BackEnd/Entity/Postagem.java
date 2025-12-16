package com.SenaiCommunity.BackEnd.Entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Postagem {

    @Id
    @GeneratedValue
    private Long id;

    @ManyToOne
    private Usuario autor;

    @Lob
    private String conteudo;

    private LocalDateTime dataPostagem = LocalDateTime.now();

    @Transient
    private String autorUsername;

    // ALTERAÇÃO: De List para Set (HashSet)
    @OneToMany(mappedBy = "postagem", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @Builder.Default
    private Set<ArquivoMidia> arquivos = new HashSet<>();

    // ALTERAÇÃO: De List para Set (LinkedHashSet para manter a ordem do @OrderBy)
    @OneToMany(mappedBy = "postagem", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("dataCriacao ASC")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @Builder.Default
    private Set<Comentario> comentarios = new LinkedHashSet<>();

    @OneToMany(mappedBy = "postagem", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Set<Curtida> curtidas;
}