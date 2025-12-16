package com.SenaiCommunity.BackEnd.Repository;

import com.SenaiCommunity.BackEnd.Entity.MensagemPrivada;
import com.SenaiCommunity.BackEnd.Entity.Usuario;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Pageable; // [IMPORTANTE] Necessário para a paginação
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MensagemPrivadaRepository extends JpaRepository<MensagemPrivada, Long> {

    @Query("SELECT m FROM MensagemPrivada m " +
            "JOIN FETCH m.remetente " +
            "JOIN FETCH m.destinatario " +
            "WHERE " +
            "(m.remetente.id = :id1 AND m.destinatario.id = :id2) OR " +
            "(m.remetente.id = :id2 AND m.destinatario.id = :id1)")
    List<MensagemPrivada> findMensagensEntreUsuarios(@Param("id1") Long id1, @Param("id2") Long id2, Pageable pageable);

    @Query(value = """
        WITH MensagensComParceiro AS (
            SELECT 
                m.*,
                CASE
                    WHEN m.remetente_id = :usuarioLogadoId THEN m.destinatario_id
                    ELSE m.remetente_id
                END AS outro_usuario_id,
                ROW_NUMBER() OVER(
                    PARTITION BY 
                        CASE
                            WHEN m.remetente_id = :usuarioLogadoId THEN m.destinatario_id
                            ELSE m.remetente_id
                        END
                    ORDER BY m.data_envio DESC
                ) as rn
            FROM 
                mensagem_privada m
            WHERE 
                m.remetente_id = :usuarioLogadoId OR m.destinatario_id = :usuarioLogadoId
        )
        SELECT * FROM MensagensComParceiro
        WHERE rn = 1
        ORDER BY data_envio DESC
    """, nativeQuery = true)
    List<MensagemPrivada> findUltimasMensagensPorConversa(@Param("usuarioLogadoId") Long usuarioLogadoId);

    long countByDestinatarioAndLidaIsFalse(Usuario destinatario);

    @Modifying
    @Query("UPDATE MensagemPrivada m SET m.lida = true WHERE m.destinatario = :destinatario AND m.remetente = :remetente AND m.lida = false")
    void marcarComoLidas(@Param("destinatario") Usuario destinatario, @Param("remetente") Usuario remetente);

    @Modifying
    @Transactional
    @Query("DELETE FROM MensagemPrivada m WHERE " +
            "(m.remetente.id = :id1 AND m.destinatario.id = :id2) OR " +
            "(m.remetente.id = :id2 AND m.destinatario.id = :id1)")
    void deletarConversaEntreUsuarios(@Param("id1") Long id1, @Param("id2") Long id2);
}