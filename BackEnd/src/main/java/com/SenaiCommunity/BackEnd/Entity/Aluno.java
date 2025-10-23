package com.SenaiCommunity.BackEnd.Entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;

@EqualsAndHashCode(callSuper = true)
@Data
@Entity
public class Aluno extends Usuario {

    private String curso;
    private String periodo;

    @ManyToMany(mappedBy = "alunos")
    private List<Projeto> projetos;

}
