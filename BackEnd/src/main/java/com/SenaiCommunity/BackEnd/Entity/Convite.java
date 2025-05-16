package com.SenaiCommunity.BackEnd.Entity;

import com.SenaiCommunity.BackEnd.Enum.StatusConvite;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;

@Entity
@Data
public class Convite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idConvite;

    @ManyToOne
    @JoinColumn(name = "id_remetente", nullable = false)
    private Usuario remetente;

    @ManyToOne
    @JoinColumn(name = "id_destinatario", nullable = false)
    private Usuario destinatario;

    @ManyToOne
    @JoinColumn(name = "id_grupo", nullable = false)
    private Grupos grupos;

    @Enumerated(EnumType.STRING)
    private StatusConvite status;

    private LocalDate dataConvite;
}