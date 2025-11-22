package com.SenaiCommunity.BackEnd.DTO;

import com.fasterxml.jackson.annotation.JsonInclude; // ✅ IMPORT ADICIONADO
import lombok.AllArgsConstructor;
import lombok.Builder; // ✅ IMPORT ADICIONADO
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime; // ✅ IMPORT ADICIONADO
import java.util.List;

@Data
@Builder // ✅ ADICIONADO (seu PostagemService usa)
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL) // ✅ ADICIONADO (útil)
public class PostagemSaidaDTO {

    // --- Campos do seu builder ---
    private Long id;
    private String conteudo;
    private LocalDateTime dataCriacao; // Seu service usa dataPostagem, mas o DTO de comentário usa dataCriacao. Verifique qual o certo.
    private Long autorId;
    private String nomeAutor;
    private String urlFotoAutor;
    private List<String> urlsMidia;
    private List<ComentarioSaidaDTO> comentarios;
    private Integer totalCurtidas;
    private boolean curtidoPeloUsuario;

    /**
     * ✅ CAMPO ADICIONADO:
     * Usado pelo WebSocket para o frontend saber o que fazer.
     */
    @Builder.Default // Garante que o builder sempre inclua "atualizacao"
    private String tipo = "atualizacao";

}