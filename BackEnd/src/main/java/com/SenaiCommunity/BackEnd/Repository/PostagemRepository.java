package com.SenaiCommunity.BackEnd.Repository;

import com.SenaiCommunity.BackEnd.Entity.Postagem;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostagemRepository extends JpaRepository<Postagem, Long> {
    @EntityGraph(attributePaths = {"autor", "arquivos", "comentarios", "curtidas"})
    List<Postagem> findTop10ByOrderByDataPostagemDesc();
    @EntityGraph(attributePaths = {"autor", "arquivos", "comentarios", "curtidas"})
    List<Postagem> findByAutorIdOrderByDataPostagemDesc(Long usuarioId);
}