package com.SenaiCommunity.BackEnd.Repository;

import com.SenaiCommunity.BackEnd.Entity.ProjetoMembro;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjetoMembroRepository extends JpaRepository<ProjetoMembro, Long> {

    Optional<ProjetoMembro> findByProjetoIdAndUsuarioId(Long projetoId, Long usuarioId);

    List<ProjetoMembro> findByProjetoId(Long projetoId);

    List<ProjetoMembro> findByUsuarioId(Long usuarioId);

    @Query("SELECT COUNT(pm) FROM ProjetoMembro pm WHERE pm.projeto.id = :projetoId")
    Integer countMembrosByProjetoId(@Param("projetoId") Long projetoId);

    @Query("SELECT pm FROM ProjetoMembro pm WHERE pm.projeto.id = :projetoId AND pm.role = :role")
    List<ProjetoMembro> findByProjetoIdAndRole(@Param("projetoId") Long projetoId, @Param("role") ProjetoMembro.RoleMembro role);

    boolean existsByProjetoIdAndUsuarioId(Long projetoId, Long usuarioId);

}
