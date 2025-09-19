package com.SenaiCommunity.BackEnd.Repository;

import com.SenaiCommunity.BackEnd.Entity.Amizade;
import com.SenaiCommunity.BackEnd.Entity.StatusAmizade;
import com.SenaiCommunity.BackEnd.Entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface AmizadeRepository extends JpaRepository<Amizade, Long> {

    // Encontra uma amizade entre dois usuários, independente de quem enviou o convite
    @Query("SELECT a FROM Amizade a WHERE (a.solicitante = ?1 AND a.solicitado = ?2) OR (a.solicitante = ?2 AND a.solicitado = ?1)")
    Optional<Amizade> findAmizadeEntreUsuarios(Usuario u1, Usuario u2);

    // Lista todas as solicitações pendentes para um usuário
    List<Amizade> findBySolicitadoAndStatus(Usuario solicitado, StatusAmizade status);

    // Lista todos os amigos de um usuário (onde o status é ACEITO)
    @Query("SELECT a FROM Amizade a WHERE (a.solicitante = ?1 OR a.solicitado = ?1) AND a.status = 'ACEITO'")
    List<Amizade> findAmigosByUsuario(Usuario usuario);
}