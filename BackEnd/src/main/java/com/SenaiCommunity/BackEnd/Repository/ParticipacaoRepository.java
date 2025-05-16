package com.SenaiCommunity.BackEnd.Repository;

import com.SenaiCommunity.BackEnd.Entity.Participacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ParticipacaoRepository extends JpaRepository<Participacao, Long> {
}
