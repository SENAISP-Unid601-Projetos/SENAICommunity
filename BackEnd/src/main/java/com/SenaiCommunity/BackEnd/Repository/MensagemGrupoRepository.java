package com.SenaiCommunity.BackEnd.Repository;

import com.SenaiCommunity.BackEnd.Entity.MensagemGrupo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Repository
public interface MensagemGrupoRepository extends JpaRepository<MensagemGrupo, Long> {
    Page<MensagemGrupo> findByProjetoIdOrderByDataEnvioDesc(Long projetoId, Pageable pageable);
}
