package com.SenaiCommunity.BackEnd.Service;

import com.SenaiCommunity.BackEnd.Entity.Aluno;
import com.SenaiCommunity.BackEnd.Repository.AlunoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AlunoService {

    private final AlunoRepository alunoRepository;

    public Aluno salvar(Aluno aluno) {
        return alunoRepository.save(aluno);
    }

    public List<Aluno> listarTodos() {
        return alunoRepository.findAll();
    }

    public Optional<Aluno> buscarPorId(Long id) {
        return alunoRepository.findById(id);
    }

    public Aluno atualizar(Long id, Aluno novoAluno) {
        return alunoRepository.findById(id).map(aluno -> {
            aluno.setNomeCompleto(novoAluno.getNomeCompleto());
            aluno.setCurso(novoAluno.getCurso());
            aluno.setPeriodo(novoAluno.getPeriodo());
            aluno.setStatusConta(novoAluno.getStatusConta());
            aluno.setEmail(novoAluno.getEmail());
            aluno.setFotoPerfil(novoAluno.getFotoPerfil());
            return alunoRepository.save(aluno);
        }).orElseThrow(() -> new RuntimeException("Aluno não encontrado."));
    }

    public void deletar(Long id) {
        alunoRepository.deleteById(id);
    }
}