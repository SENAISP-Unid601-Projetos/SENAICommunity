package com.SenaiCommunity.BackEnd.DTO;

import com.SenaiCommunity.BackEnd.Entity.Usuario;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
public class UsuarioSaidaDTO {

    private Long id;
    private String nome;
    private String email;
    private String tipoUsuario;
    private String urlFotoPerfil;
    private String bio;
    private LocalDate dataNascimento;
    private LocalDateTime dataCadastro;

    // Código Corrigido em UsuarioSaidaDTO.java

    public UsuarioSaidaDTO(Usuario usuario) {
        this.id = usuario.getId();
        this.nome = usuario.getNome();
        this.email = usuario.getEmail();
        this.tipoUsuario = usuario.getTipoUsuario();
        this.bio = usuario.getBio();
        this.dataNascimento = usuario.getDataNascimento();
        this.dataCadastro = usuario.getDataCadastro();

        String nomeFoto = usuario.getFotoPerfil();
        if (nomeFoto != null && !nomeFoto.isBlank()) {
            this.urlFotoPerfil = "/api/arquivos/" + nomeFoto;
        } else {
            // CORREÇÃO: Aponte para a sua imagem padrão
            this.urlFotoPerfil = "/images/default-avatar-icon.jpg";
        }
    }
}