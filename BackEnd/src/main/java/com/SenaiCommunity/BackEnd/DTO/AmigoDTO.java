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

}