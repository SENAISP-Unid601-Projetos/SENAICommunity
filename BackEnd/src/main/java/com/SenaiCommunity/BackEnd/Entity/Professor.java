package com.SenaiCommunity.BackEnd.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.List;

@EqualsAndHashCode(callSuper = true)
@Data
@Entity
public class Professor extends Usuario {

    private String formacao;
    private String areaAtuacao;

    @ManyToMany(mappedBy = "professores")
    private List<Projeto> projetosOrientados;
}
