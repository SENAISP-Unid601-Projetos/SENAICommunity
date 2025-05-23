package com.SenaiCommunity.BackEnd.Service;

import com.SenaiCommunity.BackEnd.Dto.UsuarioCadastroDto;
import com.SenaiCommunity.BackEnd.Entity.Aluno;
import com.SenaiCommunity.BackEnd.Entity.Professor;
import com.SenaiCommunity.BackEnd.Repository.AlunoRepository;
import com.SenaiCommunity.BackEnd.Repository.ProfessorRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final AlunoRepository alunoRepository;
    private final ProfessorRepository professorRepository;

    @Transactional
    public void cadastrarUsuario(UsuarioCadastroDto dto) {
        if (dto.getCodigoSn() != null && !dto.getCodigoSn().isEmpty()) {
            Professor professor = new Professor();
            professor.setNome(dto.getNomeCompleto());
            professor.setEmail(dto.getEmail());
            professor.setSenha(dto.getSenha()); // Faça encode se estiver usando PasswordEncoder
            professor.setFotoPerfil(dto.getFotoPerfil());
            professor.setTipoUsuario("PROFESSOR");
            professor.setFormacao("");
            professor.setAreaAtuacao("");
            professorRepository.save(professor);
        } else if (dto.getMatricula() != null && !dto.getMatricula().isEmpty()) {
            Aluno aluno = new Aluno();
            aluno.setNome(dto.getNomeCompleto());
            aluno.setEmail(dto.getEmail());
            aluno.setSenha(dto.getSenha()); // Faça encode se estiver usando PasswordEncoder
            aluno.setFotoPerfil(dto.getFotoPerfil());
            aluno.setTipoUsuario("ALUNO");
            aluno.setCurso("");
            aluno.setPeriodo("");
            aluno.setStatusConta("ATIVO");
            alunoRepository.save(aluno);
        } else {
            throw new IllegalArgumentException("É necessário fornecer Código SN (professor) ou Matrícula (aluno).");
        }
    }

    public Optional<Aluno> getAlunoById(Long id) {
        return alunoRepository.findById(id);
    }

    public Optional<Professor> getProfessorById(Long id) {
        return professorRepository.findById(id);
    }

    public void deletarAluno(Long id) {
        alunoRepository.deleteById(id);
    }

    public void deletarProfessor(Long id) {
        professorRepository.deleteById(id);
    }

    public Aluno atualizarAluno(Long id, Aluno novoAluno) {
        return alunoRepository.findById(id).map(aluno -> {
            aluno.setNome(novoAluno.getNome());
            aluno.setCurso(novoAluno.getCurso());
            aluno.setPeriodo(novoAluno.getPeriodo());
            aluno.setStatusConta(novoAluno.getStatusConta());
            return alunoRepository.save(aluno);
        }).orElseThrow(() -> new RuntimeException("Aluno não encontrado."));
    }

    public Professor atualizarProfessor(Long id, Professor novoProfessor) {
        return professorRepository.findById(id).map(prof -> {
            prof.setNome(novoProfessor.getNome());
            prof.setFormacao(novoProfessor.getFormacao());
            prof.setAreaAtuacao(novoProfessor.getAreaAtuacao());
            return professorRepository.save(prof);
        }).orElseThrow(() -> new RuntimeException("Professor não encontrado."));
    }
}
