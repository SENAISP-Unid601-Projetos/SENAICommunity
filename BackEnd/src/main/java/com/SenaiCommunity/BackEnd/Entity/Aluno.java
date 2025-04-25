package com.SenaiCommunity.BackEnd.Entity;

import jakarta.persistence.Entity;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
public class Aluno {
    private Long id;
    private String nomeCompleto;
    private String email;
    private String senha;
    private String matricula;
    private String curso;
    private String periodo;
    private String fotoPerfilUrl;
    private LocalDate dataNascimento;
    private List<Telefone> telefone;
    private String statusConta; // Ex: "Ativo", "Inativo"
    private LocalDate
            dataCadastro;

    // Relacionamentos (exemplos)
    private Projeto projeto;
    private  MensagensChat mensagens;

}
