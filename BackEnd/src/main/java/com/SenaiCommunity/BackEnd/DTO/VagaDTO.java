package com.SenaiCommunity.BackEnd.DTO;

import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Data
public class VagaDTO {
    private Long id;
    private String titulo;
    private String empresa;
    private String logoUrl;
    private String local;
    private String cidade;
    private String nivel;
    private String tipo;
    private String descricao;
    private LocalDate dataPublicacao;
    private List<String> tags;
    private String publicado; // Campo novo para o texto "há X dias"
}