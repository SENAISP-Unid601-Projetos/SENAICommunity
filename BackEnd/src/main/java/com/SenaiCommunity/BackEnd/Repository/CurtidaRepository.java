package com.SenaiCommunity.BackEnd.Repository;

import com.SenaiCommunity.BackEnd.Entity.Curtida;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CurtidaRepository extends JpaRepository<Curtida, Long> {

    // Métodos para encontrar uma curtida específica
    Optional<Curtida> findByUsuarioIdAndPostagemId(Long usuarioId, Long postagemId);
    Optional<Curtida> findByUsuarioIdAndComentarioId(Long usuarioId, Long comentarioId);
}
