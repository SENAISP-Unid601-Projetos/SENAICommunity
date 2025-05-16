package com.SenaiCommunity.BackEnd.Entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;

@Data
@Entity
@Inheritance(strategy = InheritanceType.JOINED)
public abstract class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome;
    private String email;
    private String senha;
    private String fotoPerfil;
    private Date dataNascimento;
    private String bio;

    private LocalDateTime dataCadastro;

    private String tipoUsuario; // ALUNO ou PROFESSOR

    @OneToMany(mappedBy = "usuario", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Telefone> telefones;

}
