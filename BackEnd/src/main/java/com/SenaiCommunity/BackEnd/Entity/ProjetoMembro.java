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
@Table(name = "projeto_membros")
public class ProjetoMembro {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "projeto_id")
    @ToString.Exclude
    private Projeto projeto;

    @ManyToOne
    @JoinColumn(name = "usuario_id")
    @ToString.Exclude
    private Usuario usuario;

    @Enumerated(EnumType.STRING)
    private RoleMembro role;

    private LocalDateTime dataEntrada;

    @ManyToOne
    @JoinColumn(name = "convidado_por_id")
    private Usuario convidadoPor;

    public enum RoleMembro {
        ADMIN,      // Pode fazer tudo
        MODERADOR,  // Pode expulsar membros comuns, mas não outros moderadores/admins
        MEMBRO      // Apenas participar do chat
    }
}
