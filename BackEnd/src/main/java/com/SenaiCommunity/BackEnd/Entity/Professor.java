package com.SenaiCommunity.BackEnd.Entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;

@EqualsAndHashCode(callSuper = true)
@Data
@Entity
public class Professor extends Usuario {

    private String formacao;
    private String codigoSn;

    @ManyToMany(mappedBy = "professores")
    private List<Projeto> projetosOrientados;
}
