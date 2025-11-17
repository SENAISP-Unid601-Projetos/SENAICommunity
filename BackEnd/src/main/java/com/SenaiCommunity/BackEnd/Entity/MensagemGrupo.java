package com.SenaiCommunity.BackEnd.Entity;

import jakarta.persistence.*;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor

public class MensagemGrupo {

    @Id
    @GeneratedValue
    private Long id;

    @ManyToOne
    private Usuario autor;

    @ManyToOne
    private Projeto projeto;

    @Lob
    private String conteudo;

    private LocalDateTime dataEnvio = LocalDateTime.now();

    @Transient // não persistido diretamente no banco
    private String autorUsername;

    @OneToMany(mappedBy = "mensagemGrupo", cascade = CascadeType.ALL)
    private List<ArquivoMidia> anexos;
}

