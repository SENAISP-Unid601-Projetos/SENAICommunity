package com.SenaiCommunity.BackEnd.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;


import java.time.LocalDate;


import java.util.List;


@Data
@Entity
public class Grupos {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome;

    // Relacionamento com Projeto (um projeto tem um grupo)
    @OneToOne
    @JoinColumn(name = "projeto_id")
    private Projeto projeto;

    // Relacionamento com usuários (alunos e professores)
    @ManyToMany
    @JoinTable(
            name = "grupo_usuarios",
            joinColumns = @JoinColumn(name = "grupo_id"),
            inverseJoinColumns = @JoinColumn(name = "usuario_id")
    )
    private List<Usuario> usuarios;

    // Lista de mensagens do grupo
    @OneToMany(mappedBy = "grupo", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MensagensGrupo> mensagens;
}

