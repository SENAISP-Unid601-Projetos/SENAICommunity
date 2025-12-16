package com.SenaiCommunity.BackEnd.Entity;

import com.SenaiCommunity.BackEnd.Enum.StatusAmizade;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"solicitante_id", "solicitado_id"})
        },
        // ADICIONE ISTO:
        indexes = {
                @Index(name = "idx_amizade_status", columnList = "status"),
                @Index(name = "idx_amizade_solicitante", columnList = "solicitante_id"),
                @Index(name = "idx_amizade_solicitado", columnList = "solicitado_id")
        }
)
public class Amizade {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "solicitante_id", nullable = false)
    private Usuario solicitante;

    @ManyToOne
    @JoinColumn(name = "solicitado_id", nullable = false)
    private Usuario solicitado;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusAmizade status;

    private LocalDateTime dataSolicitacao;
}