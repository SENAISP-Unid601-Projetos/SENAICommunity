package com.SenaiCommunity.BackEnd.DTO;

import com.SenaiCommunity.BackEnd.Entity.Vaga;
import com.SenaiCommunity.BackEnd.Enum.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

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

    // Novos campos de saída
    private String salario;
    private List<String> requisitos;
    private List<String> beneficios;

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

        // Mapeando os novos campos
        this.salario = vaga.getSalario();
        this.requisitos = vaga.getRequisitos();
        this.beneficios = vaga.getBeneficios();
    }
}