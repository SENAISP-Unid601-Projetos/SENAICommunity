package com.SenaiCommunity.BackEnd.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List; // Importar List

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MensagemProjeto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private Usuario autor;

    @ManyToOne
    private Projeto projeto;

    @Column(columnDefinition = "TEXT") // Bom para textos mais longos
    private String conteudo;

    private LocalDateTime dataEnvio = LocalDateTime.now();

    @OneToMany(mappedBy = "mensagem", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<ArquivoMensagemProjeto> arquivos;
}