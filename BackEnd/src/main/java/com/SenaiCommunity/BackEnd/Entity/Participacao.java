package com.SenaiCommunity.BackEnd.Entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;

@Data
@Entity
public class Participacao {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate dataEntrada;
    private String papel;

    @ManyToOne
    @JoinColumn(name = "usuario_id")
    private Aluno usuario;

    @ManyToOne
    @JoinColumn(name = "grupo_id")
    private Grupos grupos;

}
