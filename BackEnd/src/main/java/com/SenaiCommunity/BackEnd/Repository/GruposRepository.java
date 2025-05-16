package com.SenaiCommunity.BackEnd.Repository;

import com.SenaiCommunity.BackEnd.Entity.Grupos;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GruposRepository extends JpaRepository<Grupos, Long> {
    List<Grupos> findAllByNome (String nome);
}
