package com.SenaiCommunity.BackEnd.Repository;

import com.SenaiCommunity.BackEnd.Entity.Evento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor; // IMPORTAR AQUI
import org.springframework.stereotype.Repository;

@Repository
// ADICIONAR AQUI vvvvvvvvvvvvvvvvvvvvvvvvvvv
public interface EventoRepository extends JpaRepository<Evento, Long>, JpaSpecificationExecutor<Evento> {
}