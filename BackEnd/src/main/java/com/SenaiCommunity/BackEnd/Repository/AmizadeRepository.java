package com.SenaiCommunity.BackEnd.Repository;

import com.SenaiCommunity.BackEnd.Entity.Amizade;
import com.SenaiCommunity.BackEnd.Enum.StatusAmizade;
import com.SenaiCommunity.BackEnd.Entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AmizadeRepository extends JpaRepository<Amizade, Long> {

    // Encontra uma amizade entre dois usuários
    @Query("SELECT a FROM Amizade a WHERE (a.solicitante = ?1 AND a.solicitado = ?2) OR (a.solicitante = ?2 AND a.solicitado = ?1)")
    Optional<Amizade> findAmizadeEntreUsuarios(Usuario u1, Usuario u2);

    // Listas de solicitações
    List<Amizade> findBySolicitadoAndStatus(Usuario solicitado, StatusAmizade status);
    List<Amizade> findBySolicitanteAndStatus(Usuario solicitante, StatusAmizade status);

    // Lista de amigos
    @Query("SELECT a FROM Amizade a WHERE (a.solicitante = ?1 OR a.solicitado = ?1) AND a.status = 'ACEITO'")
    List<Amizade> findAmigosByUsuario(Usuario usuario);

    // --- A CORREÇÃO ESTÁ AQUI EMBAIXO ---

    // Conta o número de amizades aceitas (Conexões)
    // Note que troquei "remetente/destinatario" por "solicitante/solicitado"
    @Query("SELECT COUNT(a) FROM Amizade a WHERE (a.solicitante.id = :userId OR a.solicitado.id = :userId) AND a.status = 'ACEITO'")
    long countAmigos(@Param("userId") Long userId);
}