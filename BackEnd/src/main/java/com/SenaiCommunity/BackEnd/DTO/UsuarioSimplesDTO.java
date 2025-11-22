package com.SenaiCommunity.BackEnd.DTO;

import com.SenaiCommunity.BackEnd.Entity.Usuario;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor // ✅ ADICIONAR
@Builder
public class UsuarioSimplesDTO {
    private Long id;
    private String nome;
    private String urlFotoPerfil; // ✅ ADICIONAR (Necessário para DTO de Comentário)
    private String tipoUsuario;

    public UsuarioSimplesDTO(Usuario usuario) {
        this.id = usuario.getId();
        this.nome = usuario.getNome();
        this.urlFotoPerfil = usuario.getFotoPerfil(); // ✅ ADICIONAR
        this.tipoUsuario = usuario.getTipoUsuario();
    }
}