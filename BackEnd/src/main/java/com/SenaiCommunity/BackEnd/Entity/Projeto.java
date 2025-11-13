package com.SenaiCommunity.BackEnd.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class Projeto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String titulo;
    private String descricao;
    private Date dataInicio;
    private Date dataEntrega;
    private String status; // PLANEJADO, EM_ANDAMENTO, CONCLUIDO

    private String imagemUrl; // URL da imagem do grupo
    private LocalDateTime dataCriacao;
    private Integer maxMembros = 50; // Limite de membros no grupo
    private Boolean grupoPrivado = false; // Se true, apenas por convite

    @OneToMany(mappedBy = "projeto", cascade = CascadeType.ALL)
    private List<MensagemGrupo> mensagens;

    @ManyToOne
    @JoinColumn(name = "autor_id")
    private Usuario autor; // Criador do projeto (sempre ADMIN)

    @OneToMany(mappedBy = "projeto", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<ProjetoMembro> membros;

    @OneToMany(mappedBy = "projeto", cascade = CascadeType.ALL)
    private List<ConviteProjeto> convites;

    // Manter compatibilidade com código existente
    @ManyToMany
    @JoinTable(name = "projeto_professores",
            joinColumns = @JoinColumn(name = "projeto_id"),
            inverseJoinColumns = @JoinColumn(name = "professor_id"))
    private List<Professor> professores;

    @ManyToMany
    @JoinTable(name = "projeto_alunos",
            joinColumns = @JoinColumn(name = "projeto_id"),
            inverseJoinColumns = @JoinColumn(name = "aluno_id"))
    private List<Aluno> alunos;
}
