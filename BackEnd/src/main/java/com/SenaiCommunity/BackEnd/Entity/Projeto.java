package com.SenaiCommunity.BackEnd.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.List;

@Data

@Entity
public class Projeto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    private String titulo;
    private String descricao;
    private Date dataInicio;
    private Date dataEntrega;
    private String status; // PLANEJADO, EM_ANDAMENTO, CONCLUIDO

    // Autor da publicação (aluno ou professor)
    @ManyToOne
    @JoinColumn(name = "autor_id")
    private Usuario autor;


    @OneToMany(mappedBy = "projeto")
    private List<Postagem> postagens;



    // Professores interessados/orientadores
    @ManyToMany
    @JoinTable(
            name = "projeto_professores",
            joinColumns = @JoinColumn(name = "projeto_id"),
            inverseJoinColumns = @JoinColumn(name = "professor_id")
    )
    private List<Professor> professores;

    // Alunos participantes
    @ManyToMany
    @JoinTable(
            name = "projeto_alunos",
            joinColumns = @JoinColumn(name = "projeto_id"),
            inverseJoinColumns = @JoinColumn(name = "aluno_id")
    )
    private List<Aluno> alunos;

    // Grupo de mensagens relacionado
    @OneToOne(mappedBy = "projeto", cascade = CascadeType.ALL)
    private Grupos grupo;

    // Avaliações do projeto
    @OneToMany(mappedBy = "projeto", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Avaliacoes> avaliacoes;
}