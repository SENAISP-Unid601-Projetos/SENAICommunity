package com.SenaiCommunity.BackEnd.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioBuscaDTO {

    private Long id;
    private String nome;
    private String email;
    private String fotoPerfil;
    private StatusAmizadeRelacao statusAmizade; // Um Enum que criaremos a seguir

    // Enum para representar o status da relação de amizade
    public enum StatusAmizadeRelacao {
        AMIGOS,
        SOLICITACAO_ENVIADA, // Você enviou o pedido
        SOLICITACAO_RECEBIDA, // Você recebeu o pedido
        NENHUMA // Nenhuma relação
    }
}