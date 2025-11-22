package com.SenaiCommunity.BackEnd.Service;

import com.SenaiCommunity.BackEnd.DTO.AmigoDTO;
import com.SenaiCommunity.BackEnd.DTO.UsuarioAtualizacaoDTO;
import com.SenaiCommunity.BackEnd.DTO.UsuarioBuscaDTO;
import com.SenaiCommunity.BackEnd.DTO.UsuarioSaidaDTO;
import com.SenaiCommunity.BackEnd.Entity.Amizade;
import com.SenaiCommunity.BackEnd.Entity.Usuario;
import com.SenaiCommunity.BackEnd.Repository.AmizadeRepository;
import com.SenaiCommunity.BackEnd.Repository.UsuarioRepository;
// import org.springframework.beans.factory.annotation.Value; // 🗑️ Removida importação não utilizada
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
// 🗑️ Removidas importações de java.nio.file.Files, java.nio.file.Path, java.nio.file.Paths
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class UsuarioService {
    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AmizadeRepository amizadeRepository;

    @Autowired
    private UserStatusService userStatusService;

    // ✅ NOVO: Injeção do serviço Cloudinary
    @Autowired
    private ArquivoMidiaService arquivoMidiaService;

    // 🗑️ REMOVIDO: Propriedade não é mais necessária para Cloudinary
    // @Value("${file.upload-dir}")
    // private String uploadDir;

    /**
     * método público para buscar usuário por email.
     * necessário para o CurtidaController.
     */
    public Usuario buscarPorEmail(String email) {
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado com o email: " + email));
    }

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

    /**
     * ✅ ATUALIZADO: Lógica para fazer upload no Cloudinary.
     */
    public UsuarioSaidaDTO atualizarFotoPerfil(Authentication authentication, MultipartFile foto) throws IOException {
        if (foto == null || foto.isEmpty()) {
            throw new IllegalArgumentException("Arquivo de foto não pode ser vazio.");
        }

        Usuario usuario = getUsuarioFromAuthentication(authentication);

        // 1. Opcional: Deletar a foto antiga no Cloudinary (se for uma URL)
        // Isso evita que fotos antigas permaneçam no Cloudinary
        if (usuario.getFotoPerfil() != null && usuario.getFotoPerfil().startsWith("http")) {
            try {
                arquivoMidiaService.deletar(usuario.getFotoPerfil());
            } catch (Exception e) {
                // Logar o erro, mas não bloquear o novo upload.
                System.err.println("Aviso: Falha ao deletar foto antiga no Cloudinary: " + e.getMessage());
            }
        }

        // 2. Fazer upload para o Cloudinary e obter a URL segura
        String urlFoto = arquivoMidiaService.upload(foto);

        // 3. Salvar a URL completa do Cloudinary na entidade Usuario
        usuario.setFotoPerfil(urlFoto);

        Usuario usuarioAtualizado = usuarioRepository.save(usuario);
        return new UsuarioSaidaDTO(usuarioAtualizado);
    }

    /**
     * ✅ ATUALIZADO: Adicionada lógica para deletar a foto do Cloudinary.
     */
    public void deletarUsuarioLogado(Authentication authentication) {
        Usuario usuario = getUsuarioFromAuthentication(authentication);

        // Opcional: Deletar a foto do Cloudinary ao deletar o usuário
        if (usuario.getFotoPerfil() != null && usuario.getFotoPerfil().startsWith("http")) {
            try {
                arquivoMidiaService.deletar(usuario.getFotoPerfil());
            } catch (IOException e) {
                System.err.println("Aviso: Falha ao deletar foto do Cloudinary durante a exclusão do usuário: " + e.getMessage());
            }
        }

        usuarioRepository.deleteById(usuario.getId());
    }

    public UsuarioSaidaDTO buscarUsuarioPorId(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado com o ID: " + id));

        // Reutiliza o mesmo DTO de saídtoBuscaDTOtoBuscaDTOa
        return new UsuarioSaidaDTO(usuario);
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

    /**
     * 🗑️ REMOVIDO: Método obsoleto que salvava foto no disco local.
     */
    // private String salvarFoto(MultipartFile foto) throws IOException {
    //     String nomeArquivo = System.currentTimeMillis() + "_" + StringUtils.cleanPath(foto.getOriginalFilename());
    //
    //     // Garante que o diretório de upload exista
    //     Path diretorioUpload = Paths.get(uploadDir);
    //     Files.createDirectories(diretorioUpload);
    //
    //     Path caminhoDoArquivo = diretorioUpload.resolve(nomeArquivo);
    //     foto.transferTo(caminhoDoArquivo);
    //
    //     // Retorna APENAS o nome do arquivo.
    //     // O restante da URL será montado no frontend ou no DTO.
    //     return nomeArquivo;
    // }

    /**
     * Busca usuários por nome e determina o status de amizade com o usuário logado.
     */
    public List<UsuarioBuscaDTO> buscarUsuariosPorNome(String nome, String emailUsuarioLogado) {
        Usuario usuarioLogado = buscarPorEmail(emailUsuarioLogado);

        List<Usuario> usuariosEncontrados = usuarioRepository.findByNomeContainingIgnoreCaseAndIdNot(nome, usuarioLogado.getId());

        return usuariosEncontrados.stream()
                .map(usuario -> toBuscaDTO(usuario, usuarioLogado))
                .collect(Collectors.toList());
    }

    /**
     * ✅ ATUALIZADO: Converte uma entidade Usuario para UsuarioBuscaDTO, incluindo o status de amizade.
     */
    private UsuarioBuscaDTO toBuscaDTO(Usuario usuario, Usuario usuarioLogado) {
        UsuarioBuscaDTO.StatusAmizadeRelacao status = determinarStatusAmizade(usuario, usuarioLogado);

        // 1. Verifica se a foto de perfil existe e não está em branco
        String urlFoto = usuario.getFotoPerfil() != null && !usuario.getFotoPerfil().isBlank()
                ? usuario.getFotoPerfil() // 2. Se existir, usa a foto (ex: Cloudinary)
                : "/images/default-avatar.png"; // 3. Se for nula, USA UMA FOTO PADRÃO

        // 4. Cria o DTO com a 'urlFoto' (que agora nunca é nula)
        return new UsuarioBuscaDTO(
                usuario.getId(),
                usuario.getNome(),
                usuario.getEmail(),
                urlFoto, // Este valor NUNCA será 'null'
                status,
                userStatusService.isOnline(usuario.getEmail()),
                usuario.getTipoUsuario()
        );
    }

    /**
     * Lógica auxiliar para verificar a relação de amizade entre dois usuários.
     */
    private UsuarioBuscaDTO.StatusAmizadeRelacao determinarStatusAmizade(Usuario usuario, Usuario usuarioLogado) {
        Optional<Amizade> amizadeOpt = amizadeRepository.findAmizadeEntreUsuarios(usuarioLogado, usuario);

        if (amizadeOpt.isEmpty()) {
            return UsuarioBuscaDTO.StatusAmizadeRelacao.NENHUMA;
        }

        Amizade amizade = amizadeOpt.get();
        switch (amizade.getStatus()) {
            case ACEITO:
                return UsuarioBuscaDTO.StatusAmizadeRelacao.AMIGOS;
            case PENDENTE:
                // Se o solicitante for o usuário logado, então a solicitação foi enviada por ele.
                if (amizade.getSolicitante().getId().equals(usuarioLogado.getId())) {
                    return UsuarioBuscaDTO.StatusAmizadeRelacao.SOLICITACAO_ENVIADA;
                } else {
                    return UsuarioBuscaDTO.StatusAmizadeRelacao.SOLICITACAO_RECEBIDA;
                }
            default: // RECUSADO ou outros estados
                return UsuarioBuscaDTO.StatusAmizadeRelacao.NENHUMA;
        }
    }
}