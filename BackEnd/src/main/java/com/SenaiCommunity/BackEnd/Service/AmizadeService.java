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

    @Transactional
    public void enviarSolicitacao(Usuario solicitante, Long idSolicitado) {
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
                "PEDIDO_AMIZADE",
                solicitacaoSalva.getId()
        );
    }

    @Transactional
    public void aceitarSolicitacao(Long amizadeId, Usuario usuarioLogado) {
        Amizade amizade = amizadeRepository.findById(amizadeId)
                .orElseThrow(() -> new RuntimeException("Solicitação não encontrada."));

        // A verificação agora é feita pelo ID do usuário, que é mais seguro
        if (!amizade.getSolicitado().getId().equals(usuarioLogado.getId())) {
            throw new SecurityException("Ação não permitida.");
        }

        amizade.setStatus(StatusAmizade.ACEITO);
        amizadeRepository.save(amizade);

        notificacaoService.criarNotificacao(amizade.getSolicitante(), amizade.getSolicitado().getNome() + " aceitou seu pedido de amizade.");
    }

    @Transactional
    public void recusarOuRemoverAmizade(Long amizadeId, Usuario usuarioLogado) {
        Amizade amizade = amizadeRepository.findById(amizadeId)
                .orElseThrow(() -> new RuntimeException("Relação não encontrada."));

        // Verifica se o usuário logado faz parte da amizade (seja como solicitante ou solicitado)
        boolean isPartOfAmizade = amizade.getSolicitado().getId().equals(usuarioLogado.getId()) ||
                amizade.getSolicitante().getId().equals(usuarioLogado.getId());

        if (!isPartOfAmizade) {
            throw new SecurityException("Ação não permitida.");
        }

        amizadeRepository.delete(amizade);
    }

    public List<SolicitacaoAmizadeDTO> listarSolicitacoesPendentes(Usuario usuarioLogado) {
        List<Amizade> solicitacoes = amizadeRepository.findBySolicitadoAndStatus(usuarioLogado, StatusAmizade.PENDENTE);
        return solicitacoes.stream()
                .map(amizade -> new SolicitacaoAmizadeDTO(
                        amizade.getId(),
                        amizade.getSolicitante().getId(),
                        amizade.getSolicitante().getNome(),
                        amizade.getSolicitante().getFotoPerfil(),
                        amizade.getDataSolicitacao()))
                .collect(Collectors.toList());
    }

    public List<SolicitacaoEnviadaDTO> listarSolicitacoesEnviadas(Usuario usuarioLogado) {
        List<Amizade> solicitacoes = amizadeRepository.findBySolicitanteAndStatus(usuarioLogado, StatusAmizade.PENDENTE);
        return solicitacoes.stream()
                .map(amizade -> new SolicitacaoEnviadaDTO(
                        amizade.getId(),
                        amizade.getSolicitado().getId(),
                        amizade.getSolicitado().getNome(),
                        amizade.getSolicitado().getFotoPerfil(),
                        amizade.getDataSolicitacao()))
                .collect(Collectors.toList());
    }

    public List<AmigoDTO> listarAmigos(Usuario usuarioLogado) {
        List<Amizade> amizades = amizadeRepository.findAmigosByUsuario(usuarioLogado);
        return amizades.stream()
                .map(amizade -> {
                    Usuario amigo = amizade.getSolicitante().getId().equals(usuarioLogado.getId())
                            ? amizade.getSolicitado()
                            : amizade.getSolicitante();
                    boolean isOnline = userStatusService.isOnline(amigo.getEmail());
                    return new AmigoDTO(amizade.getId(), amigo, isOnline);
                })
                .collect(Collectors.toList());
    }
}