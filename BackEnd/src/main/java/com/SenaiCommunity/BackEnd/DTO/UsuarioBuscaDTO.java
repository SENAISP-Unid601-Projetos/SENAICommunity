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
    private StatusAmizadeRelacao statusAmizade;
    private boolean online;

    // --- CONSTRUTOR ADICIONADO PARA O HIBERNATE ---
    // Repare que o 5º parâmetro é String (statusString), não o Enum direto.
    public UsuarioBuscaDTO(Long id, String nome, String email, String fotoPerfil, String statusString, boolean online) {
        this.id = id;
        this.nome = nome;
        this.email = email;
        this.fotoPerfil = fotoPerfil;
        this.online = online;

        // Aqui fazemos a conversão mágica de String para Enum
        if (statusString != null) {
            try {
                this.statusAmizade = StatusAmizadeRelacao.valueOf(statusString);
            } catch (IllegalArgumentException e) {
                // Se vier algo do banco que não existe no Enum, define como NENHUMA para não quebrar
                this.statusAmizade = StatusAmizadeRelacao.NENHUMA;
            }
        } else {
            this.statusAmizade = StatusAmizadeRelacao.NENHUMA;
        }
    }

    // Enum para representar o status da relação de amizade
    public enum StatusAmizadeRelacao {
        AMIGOS,
        SOLICITACAO_ENVIADA,
        SOLICITACAO_RECEBIDA,
        NENHUMA // Nenhuma relação
    }
}