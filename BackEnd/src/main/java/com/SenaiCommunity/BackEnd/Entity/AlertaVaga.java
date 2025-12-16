package com.SenaiCommunity.BackEnd.Entity;

import com.SenaiCommunity.BackEnd.Enum.NivelVaga;
import jakarta.persistence.*;
import lombok.Data;
import lombok.ToString;

@Data
@Entity
@Table(name = "alertas_vaga")
public class AlertaVaga {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String palavraChave; // Ex: "Java", "Front-end"

    @Enumerated(EnumType.STRING)
    private NivelVaga nivelInteresse;

    @ManyToOne
    @JoinColumn(name = "usuario_id")
    @ToString.Exclude
    private Usuario usuario;
}