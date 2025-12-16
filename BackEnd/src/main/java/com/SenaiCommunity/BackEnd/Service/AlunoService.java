package com.SenaiCommunity.BackEnd.Service;

import com.SenaiCommunity.BackEnd.DTO.AlunoEntradaDTO;
import com.SenaiCommunity.BackEnd.DTO.AlunoSaidaDTO;
import com.SenaiCommunity.BackEnd.Entity.Aluno;
import com.SenaiCommunity.BackEnd.Entity.Projeto;
import com.SenaiCommunity.BackEnd.Entity.Role;
import com.SenaiCommunity.BackEnd.Exception.ConteudoImproprioException;
import com.SenaiCommunity.BackEnd.Repository.AlunoRepository;
import com.SenaiCommunity.BackEnd.Repository.RoleRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
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

    @Autowired
    private ArquivoMidiaService midiaService;

    @Autowired
    private FiltroProfanidadeService filtroProfanidade;

    // Métodos de conversão direto no service:

    private Aluno toEntity(AlunoEntradaDTO dto) {
        Aluno aluno = new Aluno();
        aluno.setNome(dto.getNome());
        aluno.setEmail(dto.getEmail());
        aluno.setSenha(passwordEncoder.encode(dto.getSenha()));
        aluno.setFotoPerfil(dto.getFotoPerfil());
        aluno.setCurso(dto.getCurso());
        aluno.setPeriodo(dto.getPeriodo());
        aluno.setDataNascimento(dto.getDataNascimento());
        return aluno;
    }

    private AlunoSaidaDTO toDTO(Aluno aluno) {
        AlunoSaidaDTO dto = new AlunoSaidaDTO();
        dto.setId(aluno.getId());
        dto.setNome(aluno.getNome());
        dto.setEmail(aluno.getEmail());
        dto.setCurso(aluno.getCurso());
        dto.setPeriodo(aluno.getPeriodo());
        dto.setDataCadastro(aluno.getDataCadastro());
        dto.setBio(aluno.getBio());
        dto.setDataNascimento(aluno.getDataNascimento());

        String nomeFoto = aluno.getFotoPerfil();
        if (nomeFoto != null && !nomeFoto.isBlank()) {
            dto.setFotoPerfil(nomeFoto);
        } else {
            dto.setFotoPerfil("/images/default-avatar.jpg");
        }


        dto.setProjetos(
                aluno.getProjetos() != null
                        ? aluno.getProjetos().stream().map(Projeto::getId).collect(Collectors.toList())
                        : new ArrayList<>()
        );

        return dto;
    }

    public AlunoSaidaDTO criarAlunoComFoto(AlunoEntradaDTO dto, MultipartFile foto) {

        if (filtroProfanidade.contemProfanidade(dto.getNome()) ||
                filtroProfanidade.contemProfanidade(dto.getCurso())) {
            throw new ConteudoImproprioException("Os dados do aluno contêm texto não permitido.");
        }

        Aluno aluno = toEntity(dto);
        aluno.setFotoFundo("/images/default-background.jpg");
        aluno.setDataCadastro(LocalDateTime.now());
        aluno.setTipoUsuario("ALUNO");

        Role roleAluno = roleRepository.findByNome("ALUNO")
                .orElseThrow(() -> new RuntimeException("Role ALUNO não encontrada"));
        aluno.setRoles(Set.of(roleAluno));

        if (foto != null && !foto.isEmpty()) {
            try {
                String urlCloudinary = midiaService.upload(foto);
                aluno.setFotoPerfil(urlCloudinary);
            } catch (IOException e) {
                throw new RuntimeException("Erro ao salvar a foto do aluno: " + e.getMessage(), e);
            }
        } else {
            aluno.setFotoPerfil(null);
        }

        Aluno salvo = alunoRepository.save(aluno);
        return toDTO(salvo);
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

    @Transactional
    public AlunoSaidaDTO atualizarAluno(Long id, AlunoEntradaDTO dto, MultipartFile foto) throws IOException {
        if (filtroProfanidade.contemProfanidade(dto.getNome()) ||
                filtroProfanidade.contemProfanidade(dto.getCurso())) {
            throw new ConteudoImproprioException("Os dados do aluno contêm texto não permitido.");
        }

        // 1. Encontra o aluno existente
        Aluno aluno = alunoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Aluno não encontrado"));

        aluno.setNome(dto.getNome());
        aluno.setEmail(dto.getEmail());
        aluno.setCurso(dto.getCurso());
        aluno.setPeriodo(dto.getPeriodo());
        aluno.setDataNascimento(dto.getDataNascimento());

        if (dto.getSenha() != null && !dto.getSenha().isBlank()) {
            aluno.setSenha(passwordEncoder.encode(dto.getSenha()));
        }

        if (foto != null && !foto.isEmpty()) {
            String oldFotoUrl = aluno.getFotoPerfil();

            String newFotoUrl = midiaService.upload(foto);
            aluno.setFotoPerfil(newFotoUrl);

            if (oldFotoUrl != null && !oldFotoUrl.isBlank()) {
                try {
                    midiaService.deletar(oldFotoUrl);
                } catch (Exception e) {
                    System.err.println("AVISO: Falha ao deletar foto antiga do Cloudinary: " + oldFotoUrl);
                }
            }
        }

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
