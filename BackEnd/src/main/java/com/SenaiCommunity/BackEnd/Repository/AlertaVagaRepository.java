package com.SenaiCommunity.BackEnd.Repository;

import com.SenaiCommunity.BackEnd.Entity.AlertaVaga;
import com.SenaiCommunity.BackEnd.Entity.Usuario;
import com.SenaiCommunity.BackEnd.Enum.NivelVaga;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AlertaVagaRepository extends JpaRepository<AlertaVaga, Long> {

    // Busca alertas que tenham o nível exato da vaga OU que não tenham nível especificado (interessado em todos)
    @Query("SELECT a FROM AlertaVaga a WHERE a.nivelInteresse = :nivel OR a.nivelInteresse IS NULL")
    List<AlertaVaga> findCompativeisPorNivel(@Param("nivel") NivelVaga nivel);

    List<AlertaVaga> findByUsuario(Usuario usuario);
}