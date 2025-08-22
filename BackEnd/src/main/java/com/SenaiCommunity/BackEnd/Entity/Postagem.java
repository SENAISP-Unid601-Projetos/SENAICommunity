package com.SenaiCommunity.BackEnd.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

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

    private String conteudo;

    private LocalDateTime dataPostagem = LocalDateTime.now();

    @Transient
    private String autorUsername;

    @OneToMany(mappedBy = "postagem", cascade = CascadeType.ALL)
    private List<ArquivoMidia> arquivos = new ArrayList<>();

    @OneToMany(mappedBy = "postagem", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("dataCriacao ASC") // Opcional: para os comentários virem em ordem
    private List<Comentario> comentarios = new ArrayList<>();

}

