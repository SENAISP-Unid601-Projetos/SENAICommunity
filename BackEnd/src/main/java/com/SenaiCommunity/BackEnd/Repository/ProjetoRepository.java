package com.SenaiCommunity.BackEnd.Repository;

import com.SenaiCommunity.BackEnd.Entity.Projeto;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProjetoRepository extends JpaRepository<Projeto, Long> {

    // ✅ CORREÇÃO: Este é o método que existe no seu código.
    // O controller foi atualizado para usar este método em vez de "findByMembros_Usuario_Id".
    List<Projeto> findByAlunos_IdOrProfessores_Id(Long alunoId, Long professorId);
}