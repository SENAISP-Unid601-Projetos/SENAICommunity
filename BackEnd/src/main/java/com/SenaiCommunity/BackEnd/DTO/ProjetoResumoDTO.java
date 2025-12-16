package com.SenaiCommunity.BackEnd.DTO;

import com.SenaiCommunity.BackEnd.Entity.Projeto;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Date;

@Data
@NoArgsConstructor
public class ProjetoResumoDTO {
    private Long id;
    private String titulo;
    private String descricao; // Pode ser truncada se for muito longa
    private String imagemUrl;
    private String status;
    private String categoria;
    private Integer totalMembros;
    private Boolean grupoPrivado;
    private Date dataInicio;

    // Dados mínimos do autor
    private Long autorId;
    private String autorNome;
    private String autorFoto;

    // Construtor que converte Entidade -> DTO Resumido
    public ProjetoResumoDTO(Projeto projeto) {
        this.id = projeto.getId();
        this.titulo = projeto.getTitulo();
        this.descricao = projeto.getDescricao();
        this.imagemUrl = projeto.getImagemUrl() != null ? projeto.getImagemUrl() : "/images/projetos-default.png";
        this.status = projeto.getStatus();
        this.categoria = projeto.getCategoria();
        this.grupoPrivado = projeto.getGrupoPrivado();
        this.dataInicio = projeto.getDataInicio();

        this.totalMembros = projeto.getMembros() != null ? projeto.getMembros().size() : 0;

        if (projeto.getAutor() != null) {
            this.autorId = projeto.getAutor().getId();
            this.autorNome = projeto.getAutor().getNome();
            this.autorFoto = projeto.getAutor().getFotoPerfil();
        }
    }
}