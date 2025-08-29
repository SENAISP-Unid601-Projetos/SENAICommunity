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
public class Postagem{

    @Id
    @GeneratedValue
    private Long id;

    @ManyToOne
    private Usuario autor;

<<<<<<< HEAD
    private String conteudo;

    private LocalDateTime dataPostagem = LocalDateTime.now();

    @Transient
    private String autorUsername;

    @OneToMany(mappedBy = "postagem", cascade = CascadeType.ALL)
    private List<ArquivoMidia> arquivos = new ArrayList<>();
=======
    @Lob // Para textos mais longos
    private String conteudo;

    private LocalDateTime dataPostagem = LocalDateTime.now();

    @Transient
    private String autorUsername;

    @OneToMany(mappedBy = "postagem", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<ArquivoMidia> arquivos = new ArrayList<>();

    @OneToMany(mappedBy = "postagem", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("dataCriacao ASC") //para os comentários virem em ordem
    private List<Comentario> comentarios = new ArrayList<>();

    @OneToMany(mappedBy = "postagem", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Curtida> curtidas;
>>>>>>> back

}

