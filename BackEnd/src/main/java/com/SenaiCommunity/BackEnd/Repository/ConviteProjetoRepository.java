package com.SenaiCommunity.BackEnd.Repository;

import com.SenaiCommunity.BackEnd.Entity.ConviteProjeto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConviteProjetoRepository extends JpaRepository<ConviteProjeto, Long> {

    List<ConviteProjeto> findByProjetoIdAndStatus(Long projetoId, ConviteProjeto.StatusConvite status);

    List<ConviteProjeto> findByUsuarioConvidadoIdAndStatus(Long usuarioId, ConviteProjeto.StatusConvite status);

    Optional<ConviteProjeto> findByProjetoIdAndUsuarioConvidadoIdAndStatus(
            Long projetoId, Long usuarioId, ConviteProjeto.StatusConvite status);

    boolean existsByProjetoIdAndUsuarioConvidadoIdAndStatus(
            Long projetoId, Long usuarioId, ConviteProjeto.StatusConvite status);
}
