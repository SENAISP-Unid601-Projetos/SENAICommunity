package com.SenaiCommunity.BackEnd.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "convites_projeto")
public class ConviteProjeto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "projeto_id")
    @ToString.Exclude
    private Projeto projeto;

    @ManyToOne
    @JoinColumn(name = "usuario_convidado_id")
    @ToString.Exclude
    private Usuario usuarioConvidado;

    @ManyToOne
    @JoinColumn(name = "convidado_por_id")
    private Usuario convidadoPor;

    @Enumerated(EnumType.STRING)
    private StatusConvite status;

    private LocalDateTime dataConvite;
    private LocalDateTime dataResposta;

    public enum StatusConvite {
        PENDENTE,
        ACEITO,
        RECUSADO,
        EXPIRADO
    }
}
