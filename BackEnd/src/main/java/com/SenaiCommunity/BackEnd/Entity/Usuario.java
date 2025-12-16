package com.SenaiCommunity.BackEnd.Entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor; // Adicionado para garantir construtor vazio
import lombok.AllArgsConstructor; // Opcional, mas útil

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Objects; // Importante para o equals/hashCode
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Inheritance(strategy = InheritanceType.JOINED)
@Table(name = "usuario", indexes = {
        @Index(name = "idx_usuario_email", columnList = "email"),
        @Index(name = "idx_usuario_nome", columnList = "nome")
})
public abstract class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome;
    @Column(unique = true)
    private String email;
    private String senha;
    @Lob
    private String fotoPerfil;
    @Lob
    private String fotoFundo;
    private LocalDate dataNascimento;
    private String bio;

    private LocalDateTime dataCadastro;

    private String tipoUsuario; // ALUNO ou PROFESSOR

    @OneToMany(mappedBy = "usuario", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Telefone> telefones;

    @OneToMany(mappedBy = "usuario")
    private List<Avaliacoes> avaliacoes;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "usuario_roles",
            joinColumns = @JoinColumn(name = "usuario_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id")
    )
    private Set<Role> roles = new HashSet<>();

    @OneToMany(mappedBy = "usuario", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Curtida> curtidas;

    // A correção principal garante que o Hibernate consiga gerenciar este Set corretamente
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "usuario_bloqueios",
            joinColumns = @JoinColumn(name = "bloqueador_id"),
            inverseJoinColumns = @JoinColumn(name = "bloqueado_id")
    )
    private Set<Usuario> bloqueados = new HashSet<>();

    // --- IMPLEMENTAÇÃO CORRETA DE EQUALS E HASHCODE ---
    // Usa apenas o ID para garantir que o objeto seja encontrado no Set

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Usuario usuario = (Usuario) o;
        return Objects.equals(id, usuario.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}