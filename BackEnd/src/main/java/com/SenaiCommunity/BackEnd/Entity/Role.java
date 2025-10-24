package com.SenaiCommunity.BackEnd.Entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "tb_roles")
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "role_id")
    private long roleId;

    private String nome;


    public enum Values {

        ADMIN(1L),
        PROFESSOR(2L),
        ALUNO( 3L);

        long roleId;
        Values(long roleID) {
            this.roleId = roleID;
        }
    }
}
