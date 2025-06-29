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

    @OneToMany(mappedBy = "projeto")
    private List<MensagemGrupo> mensagens;

    // Grupo de mensagens relacionado
//    @OneToOne(mappedBy = "projeto", cascade = CascadeType.ALL)
//    private Grupos grupos;

    // Avaliações do projeto
    @OneToMany(mappedBy = "projeto", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Avaliacoes> avaliacoes;

    @ManyToOne
    @JoinColumn(name = "autor_id")
    private Usuario autor; // pode ser aluno ou professor

    @ManyToMany
    @JoinTable(name = "projeto_professores",
            joinColumns = @JoinColumn(name = "projeto_id"),
            inverseJoinColumns = @JoinColumn(name = "professor_id"))
    private List<Professor> professores; // só professores aqui

    @ManyToMany
    @JoinTable(name = "projeto_alunos",
            joinColumns = @JoinColumn(name = "projeto_id"),
            inverseJoinColumns = @JoinColumn(name = "aluno_id"))
    private List<Aluno> alunos; // só alunos aqui
}