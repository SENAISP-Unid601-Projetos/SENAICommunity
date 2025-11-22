package com.SenaiCommunity.BackEnd.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MensagemGrupoSaidaDTO {
    private Long id;
    private Long grupoId;
    private Long autorId;
    private String nomeAutor;
    private String conteudo;
    private LocalDateTime dataEnvio;
    // ✅ NOVO CAMPO
    private LocalDateTime dataEdicao;
    private String fotoAutorUrl;
}