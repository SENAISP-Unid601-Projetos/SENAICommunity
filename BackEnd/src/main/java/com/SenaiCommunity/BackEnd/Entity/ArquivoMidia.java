package com.SenaiCommunity.BackEnd.Entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import lombok.Builder;
import lombok.Data;

@Data
@Entity
@Builder
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
}