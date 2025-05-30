package com.SenaiCommunity.BackEnd.Service;


import com.SenaiCommunity.BackEnd.DTO.ProjetoDTO;
import com.SenaiCommunity.BackEnd.Entity.Aluno;
import com.SenaiCommunity.BackEnd.Entity.Professor;
import com.SenaiCommunity.BackEnd.Entity.Projeto;
import com.SenaiCommunity.BackEnd.Entity.Usuario;
import com.SenaiCommunity.BackEnd.Repository.AlunoRepository;
import com.SenaiCommunity.BackEnd.Repository.ProfessorRepository;
import com.SenaiCommunity.BackEnd.Repository.ProjetoRepository;
import com.SenaiCommunity.BackEnd.Repository.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;


import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProjetoService {

    @Autowired
    private ProjetoRepository projetoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private ProfessorRepository professorRepository;

    @Autowired
    private AlunoRepository alunoRepository;

    public List<ProjetoDTO> listarTodos() {
        List<Projeto> projetos = projetoRepository.findAll();
        return projetos.stream().map(this::converterParaDTO).collect(Collectors.toList());
    }

    public ProjetoDTO buscarPorId(Long id) {
        Projeto projeto = projetoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Projeto não encontrado com id: " + id));
        return converterParaDTO(projeto);
    }

    public ProjetoDTO salvar(ProjetoDTO dto) {
        Projeto projeto = new Projeto();

        if (dto.getId() != null) {
            projeto = projetoRepository.findById(dto.getId())
                    .orElseThrow(() -> new EntityNotFoundException("Projeto não encontrado para atualização"));
        }

        projeto.setTitulo(dto.getTitulo());
        projeto.setDescricao(dto.getDescricao());
        projeto.setDataInicio(dto.getDataInicio());
        projeto.setDataEntrega(dto.getDataEntrega());
        projeto.setStatus(dto.getStatus());

        // Autor
        Usuario autor = usuarioRepository.findById(dto.getAutorId())
                .orElseThrow(() -> new EntityNotFoundException("Autor não encontrado com id: " + dto.getAutorId()));
        projeto.setAutor(autor);

        // Professores
        if (dto.getProfessorIds() == null || dto.getProfessorIds().isEmpty()) {
            throw new IllegalArgumentException("O projeto deve ter pelo menos um professor orientador.");
        }

        List<Professor> professores = dto.getProfessorIds().stream()
                .map(id -> professorRepository.findById(id)
                        .orElseThrow(() -> new EntityNotFoundException("Professor não encontrado com id: " + id)))
                .collect(Collectors.toList());
        projeto.setProfessores(professores);

        // Alunos (pode ser vazio)
        List<Aluno> alunos = null;
        if (dto.getAlunoIds() != null && !dto.getAlunoIds().isEmpty()) {
            alunos = dto.getAlunoIds().stream()
                    .map(id -> alunoRepository.findById(id)
                            .orElseThrow(() -> new EntityNotFoundException("Aluno não encontrado com id: " + id)))
                    .collect(Collectors.toList());
        }
        projeto.setAlunos(alunos);

        Projeto salvo = projetoRepository.save(projeto);
        return converterParaDTO(salvo);
    }

    public void deletar(Long id) {
        if (!projetoRepository.existsById(id)) {
            throw new EntityNotFoundException("Projeto não encontrado com id: " + id);
        }
        projetoRepository.deleteById(id);
    }

    // Converte a entidade Projeto para ProjetoDTO
    private ProjetoDTO converterParaDTO(Projeto projeto) {
        ProjetoDTO dto = new ProjetoDTO();

        dto.setId(projeto.getId());
        dto.setTitulo(projeto.getTitulo());
        dto.setDescricao(projeto.getDescricao());
        dto.setDataInicio(projeto.getDataInicio());
        dto.setDataEntrega(projeto.getDataEntrega());
        dto.setStatus(projeto.getStatus());

        dto.setAutorId(projeto.getAutor() != null ? projeto.getAutor().getId() : null);

        if (projeto.getProfessores() != null) {
            dto.setProfessorIds(projeto.getProfessores().stream()
                    .map(Professor::getId)
                    .collect(Collectors.toList()));
        }

        if (projeto.getAlunos() != null) {
            dto.setAlunoIds(projeto.getAlunos().stream()
                    .map(Aluno::getId)
                    .collect(Collectors.toList()));
        }

        return dto;
    }
}
