package com.SenaiCommunity.BackEnd.Repository;


import com.SenaiCommunity.BackEnd.DTO.UsuarioBuscaDTO;
import com.SenaiCommunity.BackEnd.Entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByEmail(String email);

    // Busca usuários aonde o nome tenha o termo de pesquisa (ignorando maiúsculas/minúsculas)
    List<Usuario> findByNomeContainingIgnoreCaseAndIdNot(String nome, Long id);

    @Query("SELECT new com.SenaiCommunity.BackEnd.DTO.UsuarioBuscaDTO(" +
            "u.id, u.nome, u.email, u.fotoPerfil, " +
            "CASE " +
            "  WHEN a.status = 'ACEITO' THEN 'AMIGOS' " +
            "  WHEN a.status = 'PENDENTE' AND a.solicitante.id = :usuarioLogadoId THEN 'SOLICITACAO_ENVIADA' " +
            "  WHEN a.status = 'PENDENTE' AND a.solicitado.id = :usuarioLogadoId THEN 'SOLICITACAO_RECEBIDA' " +
            "  ELSE 'NENHUMA' " +
            "END, " +
            "false) " + // Online status terá que ser preenchido depois, pois está em memória RAM
            "FROM Usuario u " +
            "LEFT JOIN Amizade a ON (a.solicitante.id = u.id AND a.solicitado.id = :usuarioLogadoId) " +
            "                    OR (a.solicitado.id = u.id AND a.solicitante.id = :usuarioLogadoId) " +
            "WHERE u.nome LIKE %:nome% AND u.id != :usuarioLogadoId")
    List<UsuarioBuscaDTO> buscarUsuariosComStatus(@Param("nome") String nome, @Param("usuarioLogadoId") Long usuarioLogadoId);

}
