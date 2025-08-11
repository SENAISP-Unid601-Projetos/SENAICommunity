package com.SenaiCommunity.BackEnd.Repository;

import com.SenaiCommunity.BackEnd.Entity.ArquivoMidia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ArquivoMidiaRepository extends JpaRepository<ArquivoMidia, Long> {
    List<ArquivoMidia> findByPostagemId(Long postagemId);
}
