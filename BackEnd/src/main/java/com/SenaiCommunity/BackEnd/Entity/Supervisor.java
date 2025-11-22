package com.SenaiCommunity.BackEnd.Entity;

import jakarta.persistence.Entity;
import jakarta.persistence.PrimaryKeyJoinColumn;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
@Entity
@Table(name = "tb_supervisor")
@PrimaryKeyJoinColumn(name = "id")
public class Supervisor extends Usuario {

    // ✅ CAMPO OBRIGATÓRIO:
    // Sem este campo, o Hibernate não cria a linha na tabela de Supervisor.
    private String matricula;

}