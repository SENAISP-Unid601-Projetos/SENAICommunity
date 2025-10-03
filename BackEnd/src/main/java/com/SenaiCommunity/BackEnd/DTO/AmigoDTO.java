package com.SenaiCommunity.BackEnd.DTO;

import com.SenaiCommunity.BackEnd.Entity.Usuario;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AmigoDTO {
    private Long idAmizade;
    private Long idUsuario;
    private String nome;
    private String email;
    private String fotoPerfil;
    private boolean online;

    // Este construtor recebe a amizade, o usuário (que é o amigo) e seu status online
    public AmigoDTO(Long idAmizade, Usuario amigo, boolean online) {
        this.idAmizade = idAmizade;
        this.idUsuario = amigo.getId();
        this.nome = amigo.getNome();
        this.email = amigo.getEmail();
        this.fotoPerfil = amigo.getFotoPerfil();
        this.online = online;
    }
}