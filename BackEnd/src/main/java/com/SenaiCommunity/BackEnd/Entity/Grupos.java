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
    private String descricao;
    private LocalDate dataCriacao;

    @OneToOne
    @JoinColumn(name = "projeto_id")
    private Projeto projeto;

    @OneToMany(mappedBy = "grupos", cascade = CascadeType.ALL)
    private List<Participacao> participacoes;

    @OneToMany(mappedBy = "grupos", cascade = CascadeType.ALL)
    private List<Postagem> postagens;

    @OneToMany(mappedBy = "grupos", cascade = CascadeType.ALL)
    private List<MensagensGrupo> mensagens;

}

