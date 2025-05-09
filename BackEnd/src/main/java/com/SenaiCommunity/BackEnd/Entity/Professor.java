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
public class Professor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    // Dados pessoais
    private String nomeCompleto;
    private String email;
    private String senha;
    private String fotoPerfil;
    private Date dataNascimento;
    private String bio;
    @Temporal(TemporalType.TIMESTAMP)
    private Date dataCadastro;

    // Contato
    @OneToMany(mappedBy = "professor", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Telefone> telefones;

    // Acadêmico/profissional
    private String formacao;
    private String areaAtuacao;

    // Sistema
    private String tipoUsuario;

    //Relacionamentos
    @OneToMany(mappedBy = "professor")
    private List<Projeto> projetosOrientados;

}
