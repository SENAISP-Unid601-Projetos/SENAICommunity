package com.SenaiCommunity.BackEnd.Service;

import com.SenaiCommunity.BackEnd.DTO.AlunoEntradaDTO;
import com.SenaiCommunity.BackEnd.DTO.AlunoSaidaDTO;
import com.SenaiCommunity.BackEnd.Entity.Aluno;
import com.SenaiCommunity.BackEnd.Entity.Projeto;
import com.SenaiCommunity.BackEnd.Entity.Role;
import com.SenaiCommunity.BackEnd.Repository.AlunoRepository;
import com.SenaiCommunity.BackEnd.Repository.RoleRepository;
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
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AlunoService {

    @Autowired
    private AlunoRepository alunoRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // Métodos de conversão direto no service:

    private Aluno toEntity(AlunoEntradaDTO dto) {
        Aluno aluno = new Aluno();
        aluno.setNome(dto.getNome());
        aluno.setEmail(dto.getEmail());
        aluno.setSenha(passwordEncoder.encode(dto.getSenha()));
        aluno.setFotoPerfil(dto.getFotoPerfil());
        aluno.setCurso(dto.getCurso());
        aluno.setPeriodo(dto.getPeriodo());
        aluno.setBio(dto.getBio());
        aluno.setDataNascimento(dto.getDataNascimento());
        return aluno;
    }

    private AlunoSaidaDTO toDTO(Aluno aluno) {
        AlunoSaidaDTO dto = new AlunoSaidaDTO();
        dto.setId(aluno.getId());
        dto.setNome(aluno.getNome());
        dto.setEmail(aluno.getEmail());
        dto.setFotoPerfil(aluno.getFotoPerfil());
        dto.setCurso(aluno.getCurso());
        dto.setPeriodo(aluno.getPeriodo());
        dto.setDataCadastro(aluno.getDataCadastro());
        dto.setBio(aluno.getBio());
        dto.setDataNascimento(aluno.getDataNascimento());

        dto.setProjetos(
                aluno.getProjetos() != null
                        ? aluno.getProjetos().stream().map(Projeto::getId).collect(Collectors.toList())
                        : new ArrayList<>()
        );


        return dto;
    }

    public AlunoSaidaDTO criarAlunoComFoto(AlunoEntradaDTO dto, MultipartFile foto) {
        Aluno aluno = toEntity(dto);
        aluno.setDataCadastro(LocalDateTime.now());
        aluno.setTipoUsuario("ALUNO");

        // Busca a role "ALUNO" no banco
        Role roleAluno = roleRepository.findByNome("ALUNO")
                .orElseThrow(() -> new RuntimeException("Role ALUNO não encontrada"));

        // Define a role (mesmo que seja um Set, terá só uma)
        aluno.setRoles(Set.of(roleAluno));

        if (foto != null && !foto.isEmpty()) {
            try {
                String fileName = salvarFoto(foto);
                aluno.setFotoPerfil(fileName);
            } catch (IOException e) {
                throw new RuntimeException("Erro ao salvar a foto do aluno", e);
            }
        } else {
            aluno.setFotoPerfil(null); // ou "default.jpg" se quiser uma imagem padrão
        }

        Aluno salvo = alunoRepository.save(aluno);
        return toDTO(salvo);
    }


    private String salvarFoto(MultipartFile foto) throws IOException {
        String fileName = System.currentTimeMillis() + "_" + StringUtils.cleanPath(foto.getOriginalFilename());
        Path caminho = Paths.get("src/main/resources/alunoPictures/" + fileName);
        foto.transferTo(caminho);
        return fileName;
    }


    public List<AlunoSaidaDTO> listarTodos() {
        return alunoRepository.findAll()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public AlunoSaidaDTO buscarPorId(Long id) {
        Aluno aluno = alunoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Aluno não encontrado"));
        return toDTO(aluno);
    }

    public AlunoSaidaDTO atualizarAluno(Long id, AlunoEntradaDTO dto) {
        Aluno aluno = alunoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Aluno não encontrado"));

        aluno.setNome(dto.getNome());
        aluno.setEmail(dto.getEmail());
        aluno.setSenha(passwordEncoder.encode(dto.getSenha()));
        aluno.setFotoPerfil(dto.getFotoPerfil());
        aluno.setCurso(dto.getCurso());
        aluno.setPeriodo(dto.getPeriodo());
        aluno.setDataNascimento(dto.getDataNascimento());
        aluno.setBio(dto.getBio());

        Aluno atualizado = alunoRepository.save(aluno);
        return toDTO(atualizado);
    }

    public void deletarAluno(Long id) {
        if (!alunoRepository.existsById(id)) {
            throw new EntityNotFoundException("Aluno não encontrado");
        }
        alunoRepository.deleteById(id);
    }
}
