package com.SenaiCommunity.BackEnd.Entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class Telefone {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String numero;
    private String tipo; // Ex: "Celular", "Residencial"

    @ManyToOne
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;
}
