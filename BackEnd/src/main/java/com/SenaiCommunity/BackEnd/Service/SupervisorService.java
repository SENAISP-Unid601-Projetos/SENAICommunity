package com.SenaiCommunity.BackEnd.Service;

import com.SenaiCommunity.BackEnd.DTO.SupervisorEntradaDTO;
import com.SenaiCommunity.BackEnd.DTO.SupervisorSaidaDTO;
import com.SenaiCommunity.BackEnd.Entity.Role;
import com.SenaiCommunity.BackEnd.Entity.Supervisor;
import com.SenaiCommunity.BackEnd.Repository.RoleRepository;
import com.SenaiCommunity.BackEnd.Repository.SupervisorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

@Service
public class SupervisorService {

    @Autowired
    private SupervisorRepository supervisorRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ArquivoMidiaService arquivoMidiaService;

    @Transactional
    public SupervisorSaidaDTO criarSupervisorComFoto(SupervisorEntradaDTO dto, MultipartFile foto) {
        Supervisor supervisor = new Supervisor();

        // Dados Básicos (Tabela Usuario)
        supervisor.setNome(dto.getNome());
        supervisor.setEmail(dto.getEmail());
        supervisor.setSenha(passwordEncoder.encode(dto.getSenha()));
        supervisor.setDataNascimento(dto.getDataNascimento());
        supervisor.setDataCadastro(LocalDateTime.now());
        supervisor.setTipoUsuario("SUPERVISOR");

        // ✅ CORREÇÃO CRÍTICA: Gerar Matrícula (Tabela Supervisor)
        // Isso força o Hibernate a fazer o INSERT na tabela tb_supervisor
        String matriculaGerada = "SUP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        supervisor.setMatricula(matriculaGerada);

        // Role
        Role roleSupervisor = roleRepository.findById(Role.Values.SUPERVISOR.getRoleId())
                .orElseThrow(() -> new RuntimeException("Role SUPERVISOR (ID 4) não encontrada."));
        supervisor.setRoles(Set.of(roleSupervisor));

        // Foto
        if (foto != null && !foto.isEmpty()) {
            try {
                String urlFoto = arquivoMidiaService.upload(foto);
                supervisor.setFotoPerfil(urlFoto);
            } catch (IOException e) {
                throw new RuntimeException("Erro ao fazer upload da foto: " + e.getMessage());
            }
        }

        // Salvar
        Supervisor supervisorSalvo = supervisorRepository.save(supervisor);

        return new SupervisorSaidaDTO(supervisorSalvo);
    }
}