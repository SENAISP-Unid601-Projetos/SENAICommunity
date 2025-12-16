package com.SenaiCommunity.BackEnd.Entity;

import jakarta.persistence.*;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(indexes = {
        @Index(name = "idx_msg_grupo_projeto_data", columnList = "projeto_id, dataEnvio")
})
public class MensagemGrupo {

    @Id
    @GeneratedValue
    private Long id;

    @ManyToOne
    @ToString.Exclude
    private Usuario autor;

    @ManyToOne
    @ToString.Exclude
    private Projeto projeto;

    @Lob
    private String conteudo;

    private LocalDateTime dataEnvio = LocalDateTime.now();

    @Transient // não persistido diretamente no banco
    private String autorUsername;

    @OneToMany(mappedBy = "mensagemGrupo", cascade = CascadeType.ALL)
    private List<ArquivoMidia> anexos;
}

