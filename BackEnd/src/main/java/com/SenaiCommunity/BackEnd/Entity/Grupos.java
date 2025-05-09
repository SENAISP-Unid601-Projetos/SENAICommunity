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

    private long id_grupo;
    private String nome;
    private String descricao;
    private LocalDate data_criacao;

    @OneToOne
    @JoinColumn(name = "projeto_id")
    private Projeto projeto;

    @OneToMany(mappedBy = "grupo", cascade = CascadeType.ALL)
    private List<Participacao> participacoes;

    @OneToMany(mappedBy = "grupo", cascade = CascadeType.ALL)
    private List<Publicacao> publicacoes;

    @OneToMany(mappedBy = "grupo", cascade = CascadeType.ALL)
    private List<MensagensGrupo> mensagens;

}

