package com.SenaiCommunity.BackEnd.Repository;

import com.SenaiCommunity.BackEnd.Entity.MensagemGrupo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MensagemGrupoRepository extends JpaRepository<MensagemGrupo, Long> {
    List<MensagemGrupo> findByProjetoIdOrderByDataEnvioAsc(Long projetoId);
}
