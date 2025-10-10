package com.SenaiCommunity.BackEnd.Entity;

import com.SenaiCommunity.BackEnd.Enum.*;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

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

    @Enumerated(EnumType.STRING)
    private LocalizacaoVaga localizacao;

    @Enumerated(EnumType.STRING)
    private NivelVaga nivel;

    @Enumerated(EnumType.STRING)
    private TipoContratacao tipoContratacao;

    private LocalDateTime dataPublicacao;

    @ManyToOne
    @JoinColumn(name = "autor_id")
    private Usuario autor; // Usuário (Admin/Professor) que publicou a vaga
}