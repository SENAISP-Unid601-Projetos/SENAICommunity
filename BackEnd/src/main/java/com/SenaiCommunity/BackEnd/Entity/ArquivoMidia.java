package com.SenaiCommunity.BackEnd.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ArquivoMidia {

    @Id
    @GeneratedValue
    private Long id;

    private String url; // caminho no servidor ou cloud (S3, etc.)
    private String tipo; // "imagem", "video", "audio"
    private String nomeOriginal;
    private String extensao;
    private long tamanho;

    @ManyToOne
    private Postagem postagem;

    @ManyToOne
    @JoinColumn(name = "mensagem_grupo_id")
    private MensagemGrupo mensagemGrupo;
}