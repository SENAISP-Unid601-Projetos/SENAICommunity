package com.SenaiCommunity.BackEnd.Entity;

import com.SenaiCommunity.BackEnd.Enum.*;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@Table(name = "vagas")
public class Vaga {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String titulo;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String descricao;

    private String empresa;

    private String salario;

    private String imagemUrl;

    @ElementCollection
    @CollectionTable(name = "vaga_requisitos", joinColumns = @JoinColumn(name = "vaga_id"))
    @Column(name = "requisito")
    private List<String> requisitos = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "vaga_beneficios", joinColumns = @JoinColumn(name = "vaga_id"))
    @Column(name = "beneficio")
    private List<String> beneficios = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    private LocalizacaoVaga localizacao;

    @Enumerated(EnumType.STRING)
    private NivelVaga nivel;

    @Enumerated(EnumType.STRING)
    private TipoContratacao tipoContratacao;

    private LocalDateTime dataPublicacao;

    @ManyToOne
    @JoinColumn(name = "autor_id")
    private Usuario autor;
}