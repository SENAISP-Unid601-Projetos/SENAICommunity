package com.SenaiCommunity.BackEnd.Entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Entity
public class MensagensGrupo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String mensagem;
    private LocalDateTime dataHora; // Data e hora da mensagem


    @ManyToOne
    @JoinColumn(name = "remetente_id")
    private Usuario remetente; // Usuário que envia a mensagem (Aluno ou Professor)


    @ManyToOne
    @JoinColumn(name = "destinatario_id")
    private Usuario destinatario; // Usuário que recebe a mensagem (Aluno ou Professor)

    @PrePersist
    public void prePersist() {
        if (dataHora == null) {
            dataHora = LocalDateTime.now(); // Define a data e hora atual quando a mensagem é criada
        }
    }
}
