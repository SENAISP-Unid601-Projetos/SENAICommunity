package com.SenaiCommunity.BackEnd.Entity;
import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
public class ImagemPostagem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String url;

    @ManyToOne
    @JoinColumn(name = "postagem_id")
    private Postagem postagem;
}

