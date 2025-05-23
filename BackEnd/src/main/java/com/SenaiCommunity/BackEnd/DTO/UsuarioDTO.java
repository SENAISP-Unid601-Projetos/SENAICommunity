package com.SenaiCommunity.BackEnd.DTO;


import com.SenaiCommunity.BackEnd.Entity.Avaliacoes;
import com.SenaiCommunity.BackEnd.Entity.Telefone;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioDTO {
    private Long id;
    private String nomeCompleto;
    private String cpf;
    private String email;
    private String fotoPerfil;
    private Date dataNascimento;
    private String bio;
    private LocalDateTime dataCadastro;
    private String tipoUsuario; // "ALUNO" ou "PROFESSOR"
    private List<Telefone> telefones;
    private List<Avaliacoes> avaliacoes;

}

