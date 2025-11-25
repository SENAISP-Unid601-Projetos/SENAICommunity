package com.SenaiCommunity.BackEnd.Service;

import com.SenaiCommunity.BackEnd.DTO.UsuarioAtualizacaoDTO;
import com.SenaiCommunity.BackEnd.DTO.UsuarioBuscaDTO;
import com.SenaiCommunity.BackEnd.DTO.UsuarioSaidaDTO;
import com.SenaiCommunity.BackEnd.Entity.Amizade;
import com.SenaiCommunity.BackEnd.Entity.Usuario;
import com.SenaiCommunity.BackEnd.Exception.ConteudoImproprioException;
import com.SenaiCommunity.BackEnd.Repository.AmizadeRepository;
import com.SenaiCommunity.BackEnd.Repository.ProjetoMembroRepository;
import com.SenaiCommunity.BackEnd.Repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
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

    @Autowired
    private ArquivoMidiaService midiaService;

    @Autowired
    private FiltroProfanidadeService filtroProfanidade;

    @Autowired
    private ProjetoMembroRepository projetoMembroRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    private UsuarioSaidaDTO criarDTOComContagem(Usuario usuario) {
        UsuarioSaidaDTO dto = new UsuarioSaidaDTO(usuario);
        long qtdProjetos = projetoMembroRepository.countByUsuarioId(usuario.getId());
        dto.setTotalProjetos(qtdProjetos);
        return dto;
    }

    public void notificarAtualizacaoPerfil(Usuario usuario) {
        UsuarioSaidaDTO dto = criarDTOComContagem(usuario);
        // Envia para o tópico específico deste usuário
        messagingTemplate.convertAndSend("/topic/perfil/" + usuario.getId(), dto);
    }

    public UsuarioSaidaDTO buscarUsuarioPorId(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado com o ID: " + id));
        return criarDTOComContagem(usuario);
    }

    // Adicione este método na classe UsuarioService
    public Usuario buscarEntidadePorId(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado com o ID: " + id));
    }

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
        return criarDTOComContagem(usuario);
    }

    /**
     * Atualiza os dados do usuário logado.
     */
    public UsuarioSaidaDTO atualizarUsuarioLogado(Authentication authentication, UsuarioAtualizacaoDTO dto) {
        if (filtroProfanidade.contemProfanidade(dto.getNome()) ||
                filtroProfanidade.contemProfanidade(dto.getBio())) {
            throw new ConteudoImproprioException("Seus dados de perfil contêm texto não permitido.");
        }

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
        notificarAtualizacaoPerfil(usuarioAtualizado);
        return criarDTOComContagem(usuarioAtualizado);
    }

    public UsuarioSaidaDTO atualizarFotoPerfil(Authentication authentication, MultipartFile foto) throws IOException {
        if (foto == null || foto.isEmpty()) {
            throw new IllegalArgumentException("Arquivo de foto não pode ser vazio.");
        }

        Usuario usuario = getUsuarioFromAuthentication(authentication);
        String urlCloudinary = midiaService.upload(foto);
        usuario.setFotoPerfil(urlCloudinary);

        Usuario usuarioAtualizado = usuarioRepository.save(usuario);
        notificarAtualizacaoPerfil(usuarioAtualizado);
        return criarDTOComContagem(usuarioAtualizado);

    }

    public UsuarioSaidaDTO atualizarFotoFundo(Authentication authentication, MultipartFile foto) throws IOException {
        if (foto == null || foto.isEmpty()) {
            throw new IllegalArgumentException("Arquivo de fundo não pode ser vazio.");
        }

        Usuario usuario = getUsuarioFromAuthentication(authentication);

        // Upload para o Cloudinary usando seu serviço existente
        String urlCloudinary = midiaService.upload(foto);

        // Se já tiver um fundo antigo (que não seja o padrão local), deletar do Cloudinary
        String oldFundo = usuario.getFotoFundo();
        if (oldFundo != null && oldFundo.contains("cloudinary")) {
            try {
                midiaService.deletar(oldFundo);
            } catch (Exception e) {
                System.err.println("Erro ao deletar fundo antigo: " + e.getMessage());
            }
        }

        usuario.setFotoFundo(urlCloudinary);

        Usuario usuarioAtualizado = usuarioRepository.save(usuario);
        notificarAtualizacaoPerfil(usuarioAtualizado);
        return criarDTOComContagem(usuarioAtualizado);
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
     * Converte uma entidade Usuario para UsuarioBuscaDTO, incluindo o status de amizade.
     */
    private UsuarioBuscaDTO toBuscaDTO(Usuario usuario, Usuario usuarioLogado) {
        UsuarioBuscaDTO.StatusAmizadeRelacao status = determinarStatusAmizade(usuario, usuarioLogado);

        String urlFoto = usuario.getFotoPerfil() != null && !usuario.getFotoPerfil().isBlank()
                ? usuario.getFotoPerfil()
                : "/images/default-avatar.jpg";

        return new UsuarioBuscaDTO(
                usuario.getId(),
                usuario.getNome(),
                usuario.getEmail(),
                urlFoto,
                status,
                userStatusService.isOnline(usuario.getEmail())
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