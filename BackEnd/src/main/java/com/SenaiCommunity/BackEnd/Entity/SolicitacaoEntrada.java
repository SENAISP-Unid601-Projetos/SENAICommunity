package com.SenaiCommunity.BackEnd.Entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "solicitacoes_entrada")
public class SolicitacaoEntrada {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "projeto_id", nullable = false)
    private Projeto projeto;

    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuarioSolicitante;

    @Column(nullable = false)
    private LocalDateTime dataSolicitacao;

    @Enumerated(EnumType.STRING)
    private StatusSolicitacao status;

    public enum StatusSolicitacao {
        PENDENTE,
        ACEITO,
        RECUSADO
    }
}