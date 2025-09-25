package com.SenaiCommunity.BackEnd.Entity;

import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Data;
import java.time.LocalDate;
import java.util.List;

@Entity
@Data
public class Vaga {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String titulo;
    private String empresa;
    private String logoUrl;
    private String local; // Remoto, Híbrido, Presencial
    private String cidade;
    private String nivel; // Júnior, Pleno, Sênior
    private String tipo;  // Tempo Integral, Meio Período, Estágio
    private String descricao;
    private LocalDate dataPublicacao;

    @ElementCollection
    private List<String> tags;
}