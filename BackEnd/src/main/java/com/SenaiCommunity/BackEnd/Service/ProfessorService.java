package com.SenaiCommunity.BackEnd.Service;

import com.SenaiCommunity.BackEnd.DTO.ProfessorEntradaDTO;
import com.SenaiCommunity.BackEnd.DTO.ProfessorSaidaDTO;
import com.SenaiCommunity.BackEnd.Entity.Professor;
import com.SenaiCommunity.BackEnd.Entity.Projeto;
import com.SenaiCommunity.BackEnd.Repository.ProfessorRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProfessorService {

    @Autowired
    private ProfessorRepository professorRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // Conversões

    private Professor toEntity(ProfessorEntradaDTO dto) {
        Professor professor = new Professor();
        professor.setNome(dto.getNome());
        professor.setEmail(dto.getEmail());
        professor.setSenha(passwordEncoder.encode(dto.getSenha()));
        professor.setFotoPerfil(dto.getFotoPerfil());
        professor.setFormacao(dto.getFormacao());
        professor.setAreaAtuacao(dto.getAreaAtuacao());
        professor.setCodigoSn(dto.getCodigoSn());
        return professor;
    }

    private ProfessorSaidaDTO toDTO(Professor professor) {
        ProfessorSaidaDTO dto = new ProfessorSaidaDTO();
        dto.setId(professor.getId());
        dto.setNome(professor.getNome());
        dto.setEmail(professor.getEmail());
        dto.setFotoPerfil(professor.getFotoPerfil());
        dto.setFormacao(professor.getFormacao());
        dto.setAreaAtuacao(professor.getAreaAtuacao());
        dto.setCodigoSn(professor.getCodigoSn());
        dto.setDataCadastro(professor.getDataCadastro());
        dto.setBio(professor.getBio());

        dto.setProjetosOrientados(
                professor.getProjetosOrientados() != null
                        ? professor.getProjetosOrientados().stream().map(Projeto::getId).collect(Collectors.toList())
                        : new ArrayList<>()
        );

        return dto;
    }

    public ProfessorSaidaDTO criarProfessorComFoto(ProfessorEntradaDTO dto, MultipartFile foto) {
        Professor professor = toEntity(dto);
        professor.setDataCadastro(LocalDateTime.now());
        professor.setTipoUsuario("PROFESSOR");

        if (foto == null && foto.isEmpty()) {
            professor.setFotoPerfil(null); // ou "default.jpg"
        }

        try {
            String fileName = salvarFoto(foto);
            professor.setFotoPerfil(fileName);
        } catch (IOException e) {
            throw new RuntimeException("Erro ao salvar a foto do professor", e);
        }

        Professor salvo = professorRepository.save(professor);
        return toDTO(salvo);
    }

    private String salvarFoto(MultipartFile foto) throws IOException {
        String fileName = System.currentTimeMillis() + "_" + StringUtils.cleanPath(foto.getOriginalFilename());
        Path caminho = Paths.get("src/main/resources/professorPictures/" + fileName);
        foto.transferTo(caminho);
        return fileName;
    }

    public List<ProfessorSaidaDTO> listarTodos() {
        return professorRepository.findAll()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public ProfessorSaidaDTO buscarPorId(Long id) {
        Professor professor = professorRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Professor não encontrado"));
        return toDTO(professor);
    }

    public ProfessorSaidaDTO atualizarProfessor(Long id, ProfessorEntradaDTO dto) {
        Professor professor = professorRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Professor não encontrado"));

        professor.setNome(dto.getNome());
        professor.setEmail(dto.getEmail());
        professor.setSenha(passwordEncoder.encode(dto.getSenha()));
        professor.setFotoPerfil(dto.getFotoPerfil());
        professor.setFormacao(dto.getFormacao());
        professor.setAreaAtuacao(dto.getAreaAtuacao());
        professor.setCodigoSn(dto.getCodigoSn());

        Professor atualizado = professorRepository.save(professor);
        return toDTO(atualizado);
    }

    public void deletarProfessor(Long id) {
        if (!professorRepository.existsById(id)) {
            throw new EntityNotFoundException("Professor não encontrado");
        }
        professorRepository.deleteById(id);
    }


}
