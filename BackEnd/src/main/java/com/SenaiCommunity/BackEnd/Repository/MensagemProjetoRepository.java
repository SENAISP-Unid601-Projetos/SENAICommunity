package com.SenaiCommunity.BackEnd.Repository;

import com.SenaiCommunity.BackEnd.Entity.MensagemProjeto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MensagemProjetoRepository extends JpaRepository<MensagemProjeto, Long> {
    List<MensagemProjeto> findByProjetoIdOrderByDataEnvioAsc(Long projetoId);
}