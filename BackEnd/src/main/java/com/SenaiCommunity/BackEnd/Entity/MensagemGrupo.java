package com.SenaiCommunity.BackEnd.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
<<<<<<<< HEAD:BackEnd/src/main/java/com/SenaiCommunity/BackEnd/Entity/MensagemGrupo.java
public class MensagemGrupo {
========
public class Comentario {
>>>>>>>> back:BackEnd/src/main/java/com/SenaiCommunity/BackEnd/Entity/Comentario.java

    @Id
    @GeneratedValue
    private Long id;

<<<<<<<< HEAD:BackEnd/src/main/java/com/SenaiCommunity/BackEnd/Entity/MensagemGrupo.java
    @ManyToOne
    private Usuario autor;

    @ManyToOne
    private Projeto projeto;

    private String conteudo;

    private LocalDateTime dataEnvio = LocalDateTime.now();

    @Transient // não persistido diretamente no banco
    private String autorUsername;
}
========
    @Column(nullable = false, columnDefinition = "TEXT")
    private String conteudo;

    @Builder.Default
    private LocalDateTime dataCriacao = LocalDateTime.now();

    // CAMPO para destacar o comentário
    private boolean destacado = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "autor_id", nullable = false)
    private Usuario autor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "postagem_id", nullable = false)
    private Postagem postagem;
>>>>>>>> back:BackEnd/src/main/java/com/SenaiCommunity/BackEnd/Entity/Comentario.java

    //RELACIONAMENTO PARA RESPOSTAS (Self-referencing)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id") // Coluna que armazena o ID do comentário pai
    private Comentario parent;

    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Comentario> replies = new ArrayList<>();

    @OneToMany(mappedBy = "comentario", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Curtida> curtidas;

}