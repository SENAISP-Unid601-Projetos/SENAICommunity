package com.SenaiCommunity.BackEnd.Service;

import com.SenaiCommunity.BackEnd.Dto.UsuarioCadastroDto;
import com.SenaiCommunity.BackEnd.Entity.Aluno;
import com.SenaiCommunity.BackEnd.Entity.Professor;
import com.SenaiCommunity.BackEnd.Entity.Usuario;
import com.SenaiCommunity.BackEnd.Repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class UsuarioService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public Usuario cadastrarUsuario(UsuarioCadastroDto dto) {
        // Verifica se email já existe
        Optional<Usuario> existente = usuarioRepository.findByEmail(dto.getEmail());
        if (existente.isPresent()) {
            throw new IllegalArgumentException("Email já cadastrado");
        }

        Usuario usuario;

        if (dto.getCodigoSn() != null && !dto.getCodigoSn().isEmpty()) {
            // Criar Professor
            Professor professor = new Professor();
            professor.setCodigoSn(dto.getCodigoSn());
            usuario = professor;
        } else if (dto.getMatricula() != null && !dto.getMatricula().isEmpty()) {
            // Criar Aluno
            Aluno aluno = new Aluno();
            aluno.setMatricula(dto.getMatricula());
            usuario = aluno;
        } else {
            throw new IllegalArgumentException("Informe código SN para professor ou matrícula para aluno");
        }

        usuario.setNomeCompleto(dto.getNomeCompleto());
        usuario.setEmail(dto.getEmail());
        usuario.setSenha(passwordEncoder.encode(dto.getSenha()));
        usuario.setFotoPerfil(dto.getFotoPerfil());
        usuario.setDataCadastro(LocalDateTime.now());
        usuario.setTipoUsuario((usuario instanceof Professor) ? "PROFESSOR" : "ALUNO");

        return usuarioRepository.save(usuario);
    }

    public Optional<Usuario> buscarPorEmail(String email) {
        return usuarioRepository.findByEmail(email);
    }
}
