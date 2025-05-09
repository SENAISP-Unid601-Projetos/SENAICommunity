package com.SenaiCommunity.BackEnd.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.boot.autoconfigure.security.SecurityDataConfiguration;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Data

public class Postagem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String conteudoTexto;
    private String imagemUrl;
    private LocalDateTime dataPublicacao;

    @ManyToOne
    private Usuario autor; // Pode ser Aluno ou Professor

    @OneToMany(mappedBy = "postagem", cascade = CascadeType.ALL)
    private List<Curtida> curtidas;

    @OneToMany(mappedBy = "postagem", cascade = CascadeType.ALL)
    private List<Comentario> comentarios;
}

