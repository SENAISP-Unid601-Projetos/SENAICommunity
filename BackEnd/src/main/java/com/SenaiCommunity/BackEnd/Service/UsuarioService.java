package com.SenaiCommunity.BackEnd.Service;

import com.SenaiCommunity.BackEnd.DTO.UsuarioLoginDTO;
import com.SenaiCommunity.BackEnd.DTO.UsuarioLoginSaidaDTO;
import com.SenaiCommunity.BackEnd.Entity.Usuario;
import com.SenaiCommunity.BackEnd.Repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UsuarioService {
    @Autowired
    private UsuarioRepository usuarioRepository;

    public UsuarioLoginSaidaDTO login(UsuarioLoginDTO loginDTO) {
        // Validar email
        if (loginDTO.getEmail() == null || loginDTO.getEmail().isBlank()) {
            throw new IllegalArgumentException("Email não pode ser vazio");
        }

        // Buscar usuário pelo email
        Usuario usuario = usuarioRepository.findByEmail(loginDTO.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado"));

        // Verificar senha
        if (!usuario.getSenha().equals(loginDTO.getSenha())) {
            throw new IllegalArgumentException("Senha incorreta");
        }

        // Retornar DTO de resposta
        return new UsuarioLoginSaidaDTO(
                usuario.getId(),
                usuario.getNome(),
                usuario.getEmail(),
                usuario.getTipoUsuario()
        );
    }
}
