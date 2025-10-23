package com.SenaiCommunity.BackEnd.Entity;

import com.SenaiCommunity.BackEnd.Enum.CategoriaEvento;
import com.SenaiCommunity.BackEnd.Enum.FormatoEvento;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Data
@Entity
@Table(name = "tb_eventos")
public class Evento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome;

    @Column(columnDefinition = "TEXT")
    private String descricao;

    private LocalDate data;

    private String local;

    // --- NOVO CAMPO ADICIONADO ---
    // Este campo será usado para armazenar a URL ou o caminho da imagem
    private String imagemCapa;
    // --- FIM DO NOVO CAMPO ---

    @Enumerated(EnumType.STRING)
    private FormatoEvento formato;

    @Enumerated(EnumType.STRING)
    private CategoriaEvento categoria;
}