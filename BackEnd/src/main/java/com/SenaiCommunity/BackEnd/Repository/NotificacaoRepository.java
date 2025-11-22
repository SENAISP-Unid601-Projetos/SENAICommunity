package com.SenaiCommunity.BackEnd.Repository;

import com.SenaiCommunity.BackEnd.Entity.Notificacao;
import com.SenaiCommunity.BackEnd.Entity.Usuario; // ✅ Importação adicionada
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List; // ✅ Importação adicionada

@Repository
public interface NotificacaoRepository extends JpaRepository<Notificacao, Long> {


    List<Notificacao> findByDestinatarioOrderByDataCriacaoDesc(Usuario destinatario);


    List<Notificacao> findByDestinatarioAndLidaIsFalse(Usuario destinatario);
}