package com.SenaiCommunity.BackEnd.Entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MensagemGrupo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) // ✅ CRÍTICO PARA O AUTO_INCREMENT NO MYSQL
    private Long id;

    @ManyToOne
    @JoinColumn(name = "projeto_id")
    @JsonBackReference
    private Projeto projeto;

    @ManyToOne
    @JoinColumn(name = "autor_id")
    private Usuario autor; // Pode ser nulo para mensagens de sistema

    @Column(columnDefinition = "TEXT")
    private String conteudo;

    private LocalDateTime dataEnvio;

    private LocalDateTime dataEdicao;

    // Método de conveniência para verificar o autor (usado nos services)
    public String getAutorUsername() {
        return (this.autor != null) ? this.autor.getEmail() : null;
    }
}