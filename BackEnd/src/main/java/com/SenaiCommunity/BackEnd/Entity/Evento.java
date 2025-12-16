package com.SenaiCommunity.BackEnd.Entity;

import com.SenaiCommunity.BackEnd.Enum.CategoriaEvento;
import com.SenaiCommunity.BackEnd.Enum.FormatoEvento;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "eventos", indexes = {
        @Index(name = "idx_evento_data", columnList = "data")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Evento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nome;

    @Column(nullable = false)
    private LocalDate data;
    

    @Column
    private LocalTime horaInicio; // NOVO

    @Column
    private LocalTime horaFim;

    @Column
    private String descricao;

    @Column(nullable = false, length = 150)
    private String local;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FormatoEvento formato;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CategoriaEvento categoria;

    @Column(name = "imagem_capa")
    private String imagemCapa;

    @Column(nullable = false)
    private boolean notificacaoInicioEnviada = false;

    @Column(nullable = false)
    private boolean notificacaoFimEnviada = false;

    // NOVO: Lista de interessados para notificações/lembretes
    @ManyToMany
    @JoinTable(
            name = "evento_interessados",
            joinColumns = @JoinColumn(name = "evento_id"),
            inverseJoinColumns = @JoinColumn(name = "usuario_id")
    )
    private Set<Usuario> interessados = new HashSet<>();
}