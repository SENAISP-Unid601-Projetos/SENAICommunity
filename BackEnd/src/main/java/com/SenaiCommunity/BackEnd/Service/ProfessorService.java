package com.SenaiCommunity.BackEnd.Service;
import com.SenaiCommunity.BackEnd.Entity.Professor;
import com.SenaiCommunity.BackEnd.Repository.ProfessorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ProfessorService {

    private final ProfessorRepository professorRepository;

    public Professor salvar(Professor professor) {
        return professorRepository.save(professor);
    }

    public List<Professor> listarTodos() {
        return professorRepository.findAll();
    }

    public Optional<Professor> buscarPorId(Long id) {
        return professorRepository.findById(id);
    }

    public Professor atualizar(Long id, Professor novoProfessor) {
        return professorRepository.findById(id).map(professor -> {
            professor.setNomeCompleto(novoProfessor.getNomeCompleto());
            professor.setFormacao(novoProfessor.getFormacao());
            professor.setAreaAtuacao(novoProfessor.getAreaAtuacao());
            professor.setEmail(novoProfessor.getEmail());
            professor.setFotoPerfil(novoProfessor.getFotoPerfil());
            return professorRepository.save(professor);
        }).orElseThrow(() -> new RuntimeException("Professor não encontrado."));
    }

    public void deletar(Long id) {
        professorRepository.deleteById(id);
    }
}
