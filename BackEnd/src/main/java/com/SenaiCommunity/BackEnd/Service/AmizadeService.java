package com.SenaiCommunity.BackEnd.Service;

import com.SenaiCommunity.BackEnd.DTO.AmigoDTO;
import com.SenaiCommunity.BackEnd.DTO.SolicitacaoAmizadeDTO;
import com.SenaiCommunity.BackEnd.DTO.SolicitacaoEnviadaDTO;
import com.SenaiCommunity.BackEnd.Entity.Amizade;
import com.SenaiCommunity.BackEnd.Enum.StatusAmizade;
import com.SenaiCommunity.BackEnd.Entity.Usuario;
import com.SenaiCommunity.BackEnd.Repository.AmizadeRepository;
import com.SenaiCommunity.BackEnd.Repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AmizadeService {

    @Autowired
    private AmizadeRepository amizadeRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private NotificacaoService notificacaoService;

    @Autowired
    private UserStatusService userStatusService;


    /**
     * Converte uma entidade Amizade em um DTO para representar uma solicitação pendente.
     */
    private SolicitacaoAmizadeDTO toSolicitacaoDTO(Amizade amizade) {
        Usuario solicitante = amizade.getSolicitante();
        return new SolicitacaoAmizadeDTO(
                amizade.getId(),
                solicitante.getId(),
                solicitante.getNome(),
                solicitante.getFotoPerfil(),
                amizade.getDataSolicitacao()
        );
    }

    /**
     * Converte uma entidade Amizade em um DTO para representar uma solicitação enviada.
     */
    private SolicitacaoEnviadaDTO toSolicitacaoEnviadaDTO(Amizade amizade) {
        Usuario solicitado = amizade.getSolicitado();
        return new SolicitacaoEnviadaDTO(
                amizade.getId(),
                solicitado.getId(),
                solicitado.getNome(),
                solicitado.getFotoPerfil(),
                amizade.getDataSolicitacao()
        );
    }


    /**
     * Converte uma entidade Amizade em um DTO para representar um amigo.
     * A lógica identifica qual dos dois usuários na relação é o "amigo" (não o usuário logado).
     */
    private AmigoDTO toAmigoDTO(Amizade amizade, Long idUsuarioLogado) {
        Usuario solicitante = amizade.getSolicitante();
        Usuario solicitado = amizade.getSolicitado();

        Usuario amigo = solicitante.getId().equals(idUsuarioLogado) ? solicitado : solicitante;

        return new AmigoDTO(
                amizade.getId(),
                amigo.getId(),
                amigo.getNome(),
                amigo.getEmail(),
                amigo.getFotoPerfil(),
                userStatusService.isOnline(amigo.getEmail())
        );
    }

    @Transactional
    public void enviarSolicitacao(String emailSolicitante, Long idSolicitado) {
        Usuario solicitante = usuarioRepository.findByEmail(emailSolicitante)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário solicitante não encontrado."));

        Usuario solicitado = usuarioRepository.findById(idSolicitado)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário solicitado não encontrado."));

        if (solicitante.getId().equals(solicitado.getId())) {
            throw new IllegalArgumentException("Você não pode adicionar a si mesmo.");
        }

        amizadeRepository.findAmizadeEntreUsuarios(solicitante, solicitado).ifPresent(a -> {
            throw new IllegalStateException("Já existe uma solicitação ou amizade com este usuário.");
        });

        Amizade novaSolicitacao = new Amizade();
        novaSolicitacao.setSolicitante(solicitante);
        novaSolicitacao.setSolicitado(solicitado);
        novaSolicitacao.setStatus(StatusAmizade.PENDENTE);
        novaSolicitacao.setDataSolicitacao(LocalDateTime.now());
        Amizade solicitacaoSalva = amizadeRepository.save(novaSolicitacao);

        notificacaoService.criarNotificacao(
                solicitado,
                solicitante.getNome() + " te enviou um pedido de amizade.",
                "PEDIDO_AMIZADE", // O tipo da notificação
                solicitacaoSalva.getId() // O ID da amizade para os botões de ação
        );
    }

    @Transactional
    public void aceitarSolicitacao(Long amizadeId, String emailUsuarioLogado) {
        Amizade amizade = amizadeRepository.findById(amizadeId)
                .orElseThrow(() -> new RuntimeException("Solicitação não encontrada."));

        if (!amizade.getSolicitado().getEmail().equals(emailUsuarioLogado)) {
            throw new SecurityException("Ação não permitida.");
        }

        amizade.setStatus(StatusAmizade.ACEITO);
        amizadeRepository.save(amizade);

        notificacaoService.criarNotificacao(amizade.getSolicitante(), amizade.getSolicitado().getNome() + " aceitou seu pedido de amizade.");
    }

    @Transactional
    public void recusarSolicitacao(Long amizadeId, String emailUsuarioLogado) {
        Amizade amizade = amizadeRepository.findById(amizadeId)
                .orElseThrow(() -> new RuntimeException("Solicitação não encontrada."));

        if (!amizade.getSolicitado().getEmail().equals(emailUsuarioLogado)) {
            throw new SecurityException("Ação não permitida.");
        }

        if (amizade.getStatus() != StatusAmizade.PENDENTE) {
            throw new IllegalStateException("Esta solicitação já foi respondida.");
        }

        amizadeRepository.delete(amizade);
    }

    /**
     * Lista todas as solicitações de amizade pendentes para o usuário logado.
     */
    public List<SolicitacaoAmizadeDTO> listarSolicitacoesPendentes(String emailUsuarioLogado) {
        Usuario usuario = usuarioRepository.findByEmail(emailUsuarioLogado)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado."));

        List<Amizade> solicitacoes = amizadeRepository.findBySolicitadoAndStatus(usuario, StatusAmizade.PENDENTE);

        return solicitacoes.stream()
                .map(this::toSolicitacaoDTO)
                .collect(Collectors.toList());
    }

    /**
     * Lista todas as solicitações de amizade pendentes enviadas pelo usuário logado.
     */
    public List<SolicitacaoEnviadaDTO> listarSolicitacoesEnviadas(String emailUsuarioLogado) {
        Usuario usuario = usuarioRepository.findByEmail(emailUsuarioLogado)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado."));

        List<Amizade> solicitacoes = amizadeRepository.findBySolicitanteAndStatus(usuario, StatusAmizade.PENDENTE);

        return solicitacoes.stream()
                .map(this::toSolicitacaoEnviadaDTO)
                .collect(Collectors.toList());
    }

    /**
     * Lista todos os amigos (status ACEITO) do usuário logado.
     */
    public List<AmigoDTO> listarAmigos(String emailUsuarioLogado) {
        Usuario usuario = usuarioRepository.findByEmail(emailUsuarioLogado)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado."));

        List<Amizade> amizades = amizadeRepository.findAmigosByUsuario(usuario);

        return amizades.stream()
                .map(amizade -> toAmigoDTO(amizade, usuario.getId()))
                .collect(Collectors.toList());
    }
}