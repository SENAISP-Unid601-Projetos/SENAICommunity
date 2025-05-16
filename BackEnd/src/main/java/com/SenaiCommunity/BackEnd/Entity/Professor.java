package com.SenaiCommunity.BackEnd.Entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
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
@JsonIgnoreProperties({"projetosOrientados", "postagens", "participacoes", "telefones"})
public class Professor extends Usuario {

    private String formacao;
    private String areaAtuacao;
    private String codigoSn;

    @ManyToMany(mappedBy = "professores")
    private List<Projeto> projetosOrientados;
}
