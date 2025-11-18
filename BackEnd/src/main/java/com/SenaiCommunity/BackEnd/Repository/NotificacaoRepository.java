package com.SenaiCommunity.BackEnd.Repository;

import com.SenaiCommunity.BackEnd.Entity.Notificacao;
import com.SenaiCommunity.BackEnd.Entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NotificacaoRepository extends JpaRepository<Notificacao, Long> {
    List<Notificacao> findByDestinatarioOrderByDataCriacaoDesc(Usuario destinatario);
    List<Notificacao> findByDestinatarioAndLidaIsFalse(Usuario destinatario);

    Optional<Notificacao> findTopByDestinatarioAndTipoAndIdReferenciaAndIdReferenciaSecundariaAndLidaFalse(
            Usuario destinatario,
            String tipo,
            Long idReferencia,
            Long idReferenciaSecundaria
    );
}
