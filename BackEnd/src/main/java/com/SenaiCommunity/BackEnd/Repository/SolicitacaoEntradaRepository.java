package com.SenaiCommunity.BackEnd.Repository;

import com.SenaiCommunity.BackEnd.Entity.SolicitacaoEntrada;
import com.SenaiCommunity.BackEnd.Entity.SolicitacaoEntrada.StatusSolicitacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SolicitacaoEntradaRepository extends JpaRepository<SolicitacaoEntrada, Long> {
    boolean existsByProjetoIdAndUsuarioSolicitanteIdAndStatus(Long projetoId, Long usuarioId, StatusSolicitacao status);
    Optional<SolicitacaoEntrada> findByProjetoIdAndUsuarioSolicitanteId(Long projetoId, Long usuarioId);
    List<SolicitacaoEntrada> findByProjetoIdAndStatus(Long projetoId, StatusSolicitacao status);

}