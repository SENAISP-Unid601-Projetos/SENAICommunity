package com.SenaiCommunity.BackEnd.Repository;

import com.SenaiCommunity.BackEnd.Entity.ConviteProjeto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List; // ✅ Importação necessária

@Repository
public interface ConviteProjetoRepository extends JpaRepository<ConviteProjeto, Long> {

    // Assumindo que você já tinha estes métodos (ou possa precisar deles):
    List<ConviteProjeto> findByProjetoId(Long projetoId);
    List<ConviteProjeto> findByProjetoIdAndStatus(Long projetoId, ConviteProjeto.StatusConvite status);


    /**
     * ✅ ADICIONADO PARA CORRIGIR O ERRO:
     * (Usado em ProjetoService.enviarConvite para verificar duplicados)
     */
    boolean existsByProjetoIdAndUsuarioConvidadoIdAndStatus(Long projetoId, Long usuarioConvidadoId, ConviteProjeto.StatusConvite status);

}