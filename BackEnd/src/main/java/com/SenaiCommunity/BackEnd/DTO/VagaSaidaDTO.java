package com.SenaiCommunity.BackEnd.DTO;

import com.SenaiCommunity.BackEnd.Entity.Vaga;
import com.SenaiCommunity.BackEnd.Enum.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
public class VagaSaidaDTO {
    private Long id;
    private String titulo;
    private String descricao;
    private String empresa;
    private LocalizacaoVaga localizacao;
    private NivelVaga nivel;
    private TipoContratacao tipoContratacao;
    private LocalDateTime dataPublicacao;
    private String autorNome;

    public VagaSaidaDTO(Vaga vaga) {
        this.id = vaga.getId();
        this.titulo = vaga.getTitulo();
        this.descricao = vaga.getDescricao();
        this.empresa = vaga.getEmpresa();
        this.localizacao = vaga.getLocalizacao();
        this.nivel = vaga.getNivel();
        this.tipoContratacao = vaga.getTipoContratacao();
        this.dataPublicacao = vaga.getDataPublicacao();
        this.autorNome = vaga.getAutor().getNome();
    }
}