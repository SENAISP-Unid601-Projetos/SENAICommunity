package com.SenaiCommunity.BackEnd.Service;

import com.SenaiCommunity.BackEnd.DTO.UsuarioAtualizacaoDTO;
import com.SenaiCommunity.BackEnd.DTO.UsuarioSaidaDTO;
import com.SenaiCommunity.BackEnd.Entity.Usuario;
import com.SenaiCommunity.BackEnd.Repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Service
public class UsuarioService {
    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    //Injeta o mesmo caminho do application.properties aqui
    @Value("${file.upload-dir}")
    private String uploadDir;

    /**
     * Busca o usuário logado a partir do objeto Authentication.
     */
    public UsuarioSaidaDTO buscarUsuarioLogado(Authentication authentication) {
        Usuario usuario = getUsuarioFromAuthentication(authentication);
        return new UsuarioSaidaDTO(usuario);
    }

    /**
     * Atualiza os dados do usuário logado.
     */
    public UsuarioSaidaDTO atualizarUsuarioLogado(Authentication authentication, UsuarioAtualizacaoDTO dto) {
        Usuario usuario = getUsuarioFromAuthentication(authentication);

        if (StringUtils.hasText(dto.getNome())) {
            usuario.setNome(dto.getNome());
        }
        if (dto.getBio() != null) {
            usuario.setBio(dto.getBio());
        }
        if (dto.getDataNascimento() != null) {
            usuario.setDataNascimento(dto.getDataNascimento());
        }
        if (StringUtils.hasText(dto.getSenha())) {
            usuario.setSenha(passwordEncoder.encode(dto.getSenha()));
        }

        Usuario usuarioAtualizado = usuarioRepository.save(usuario);
        return new UsuarioSaidaDTO(usuarioAtualizado);
    }

    public UsuarioSaidaDTO atualizarFotoPerfil(Authentication authentication, MultipartFile foto) throws IOException {
        if (foto == null || foto.isEmpty()) {
            throw new IllegalArgumentException("Arquivo de foto não pode ser vazio.");
        }

        Usuario usuario = getUsuarioFromAuthentication(authentication);
        String nomeArquivo = salvarFoto(foto);
        usuario.setFotoPerfil(nomeArquivo);

        Usuario usuarioAtualizado = usuarioRepository.save(usuario);
        return new UsuarioSaidaDTO(usuarioAtualizado);
    }

    /**
     * Deleta a conta do usuário logado.
     */
    public void deletarUsuarioLogado(Authentication authentication) {
        Usuario usuario = getUsuarioFromAuthentication(authentication);
        usuarioRepository.deleteById(usuario.getId());
    }

    /**
     * Método auxiliar para obter a entidade Usuario a partir do token.
     */
    private Usuario getUsuarioFromAuthentication(Authentication authentication) {
        if (authentication == null) {
            throw new SecurityException("Objeto Authentication está nulo. Verifique a configuração do Spring Security.");
        }
        String email = authentication.getName();
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado com o email do token: " + email));
    }

    private String salvarFoto(MultipartFile foto) throws IOException {
        String nomeArquivo = System.currentTimeMillis() + "_" + StringUtils.cleanPath(foto.getOriginalFilename());

        Path caminho = Paths.get(uploadDir).resolve(nomeArquivo).normalize();

        // Cria o diretório se ele não existir
        Files.createDirectories(caminho.getParent());

        foto.transferTo(caminho);
        return nomeArquivo;
    }

}