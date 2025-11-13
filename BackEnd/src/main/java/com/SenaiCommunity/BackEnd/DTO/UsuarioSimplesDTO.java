package com.SenaiCommunity.BackEnd.DTO;

import com.SenaiCommunity.BackEnd.Entity.Usuario;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class UsuarioSimplesDTO {
    private Long id;
    private String nome;

    public UsuarioSimplesDTO(Usuario usuario) {
        this.id = usuario.getId();
        this.nome = usuario.getNome();
    }
}