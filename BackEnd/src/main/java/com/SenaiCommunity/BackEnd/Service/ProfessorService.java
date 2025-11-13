package com.SenaiCommunity.BackEnd.Service;

import com.SenaiCommunity.BackEnd.DTO.ProfessorEntradaDTO;
import com.SenaiCommunity.BackEnd.DTO.ProfessorSaidaDTO;
import com.SenaiCommunity.BackEnd.Entity.Professor;
import com.SenaiCommunity.BackEnd.Entity.Projeto;
import com.SenaiCommunity.BackEnd.Entity.Role;
import com.SenaiCommunity.BackEnd.Exception.ConteudoImproprioException;
import com.SenaiCommunity.BackEnd.Repository.ProfessorRepository;
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
public class ProfessorService {

    @Autowired
    private ProfessorRepository professorRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private ArquivoMidiaService midiaService;

    @Autowired
    private FiltroProfanidadeService filtroProfanidade;

    // Conversões

    private Professor toEntity(ProfessorEntradaDTO dto) {
        Professor professor = new Professor();
        professor.setNome(dto.getNome());
        professor.setEmail(dto.getEmail());
        professor.setSenha(passwordEncoder.encode(dto.getSenha()));
        professor.setFotoPerfil(dto.getFotoPerfil());
        professor.setFormacao(dto.getFormacao());
        professor.setCodigoSn(dto.getCodigoSn());
        professor.setDataNascimento(dto.getDataNascimento());
        return professor;
    }

    private ProfessorSaidaDTO toDTO(Professor professor) {
        ProfessorSaidaDTO dto = new ProfessorSaidaDTO();
        dto.setId(professor.getId());
        dto.setNome(professor.getNome());
        dto.setEmail(professor.getEmail());
        dto.setFormacao(professor.getFormacao());
        dto.setCodigoSn(professor.getCodigoSn());
        dto.setDataCadastro(professor.getDataCadastro());
        dto.setBio(professor.getBio());
        dto.setDataNascimento(professor.getDataNascimento());

        String nomeFoto = professor.getFotoPerfil();
        if (nomeFoto != null && !nomeFoto.isBlank()) {
            dto.setFotoPerfil(nomeFoto);
        } else {
            dto.setFotoPerfil("/images/default-avatar.png");
        }

        dto.setProjetosOrientados(
                professor.getProjetosOrientados() != null
                        ? professor.getProjetosOrientados().stream().map(Projeto::getId).collect(Collectors.toList())
                        : new ArrayList<>()
        );

        return dto;
    }

    public ProfessorSaidaDTO criarProfessorComFoto(ProfessorEntradaDTO dto, MultipartFile foto) {
        if (filtroProfanidade.contemProfanidade(dto.getNome()) ||
                filtroProfanidade.contemProfanidade(dto.getFormacao())) {
            throw new ConteudoImproprioException("Os dados do professor contêm texto não permitido.");
        }

        Professor professor = toEntity(dto);
        professor.setDataCadastro(LocalDateTime.now());
        professor.setTipoUsuario("PROFESSOR");

        Role roleProfessor = roleRepository.findByNome("PROFESSOR")
                .orElseThrow(() -> new RuntimeException("Role PROFESSOR não encontrada"));
        professor.setRoles(Set.of(roleProfessor));

        if (foto != null && !foto.isEmpty()) {
            try {
                String urlCloudinary = midiaService.upload(foto);
                professor.setFotoPerfil(urlCloudinary);
            } catch (IOException e) {
                throw new RuntimeException("Erro ao salvar a foto do professor: " + e.getMessage(), e);
            }
        } else {
            professor.setFotoPerfil(null);
        }

        Professor salvo = professorRepository.save(professor);
        return toDTO(salvo);
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

    @Transactional
    public ProfessorSaidaDTO atualizarProfessor(Long id, ProfessorEntradaDTO dto, MultipartFile foto) throws IOException {
        if (filtroProfanidade.contemProfanidade(dto.getNome()) ||
                filtroProfanidade.contemProfanidade(dto.getFormacao())) {
            throw new ConteudoImproprioException("Os dados do professor contêm texto não permitido.");
        }

        Professor professor = professorRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Professor não encontrado"));

        professor.setNome(dto.getNome());
        professor.setEmail(dto.getEmail());
        professor.setFormacao(dto.getFormacao());
        professor.setCodigoSn(dto.getCodigoSn());
        professor.setDataNascimento(dto.getDataNascimento());

        if (dto.getSenha() != null && !dto.getSenha().isBlank()) {
            professor.setSenha(passwordEncoder.encode(dto.getSenha()));
        }

        if (foto != null && !foto.isEmpty()) {
            String oldFotoUrl = professor.getFotoPerfil();

            String newFotoUrl = midiaService.upload(foto);
            professor.setFotoPerfil(newFotoUrl);

            if (oldFotoUrl != null && !oldFotoUrl.isBlank()) {
                try {
                    midiaService.deletar(oldFotoUrl);
                } catch (Exception e) {
                    System.err.println("AVISO: Falha ao deletar foto antiga do Cloudinary: " + oldFotoUrl);
                }
            }
        }

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
