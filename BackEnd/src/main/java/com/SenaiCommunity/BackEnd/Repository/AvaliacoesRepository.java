package com.SenaiCommunity.BackEnd.Repository;

import com.SenaiCommunity.BackEnd.Entity.Avaliacoes;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AvaliacoesRepository extends JpaRepository<Avaliacoes, Long> {
    List<Avaliacoes> findByProjetoId(Long projetoId);
}
