package com.SenaiCommunity.BackEnd.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class Projeto {
        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        private long id;

        private String titulo;
        private String descricao;
        private Date dataInicio;
        private Date dataEntrega;
        private String status; //PLANEJADO, EM_ANDAMENTO, CONCLUIDO

        // Relacionamentos
        @ManyToMany
        private Professor professor;

        @OneToOne(mappedBy = "projeto")
        private Grupos grupo;

        @OneToMany(mappedBy = "projeto", cascade = CascadeType.ALL)
        private List<Avaliacoes> avaliacoes;

}
