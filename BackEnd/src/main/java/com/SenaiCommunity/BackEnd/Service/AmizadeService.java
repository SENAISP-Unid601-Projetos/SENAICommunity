package com.SenaiCommunity.BackEnd.Service;

import com.SenaiCommunity.BackEnd.DTO.AmigoDTO;
import com.SenaiCommunity.BackEnd.DTO.SolicitacaoAmizadeDTO;
import com.SenaiCommunity.BackEnd.DTO.SolicitacaoEnviadaDTO;
import com.SenaiCommunity.BackEnd.DTO.UsuarioBuscaDTO;
import com.SenaiCommunity.BackEnd.Entity.Amizade;
import com.SenaiCommunity.BackEnd.Entity.Usuario;
import com.SenaiCommunity.BackEnd.Enum.StatusAmizade;
import com.SenaiCommunity.BackEnd.Repository.AmizadeRepository;
import com.SenaiCommunity.BackEnd.Repository.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
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

    public long contarAmigos(Long userId) {
        return amizadeRepository.countAmigos(userId);
    }

    @Transactional
    public void enviarSolicitacao(Usuario solicitante, Long idSolicitado) {
        Usuario solicitado = usuarioRepository.findById(idSolicitado)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário solicitado não encontrado."));

        if (solicitante.getId().equals(solicitado.getId())) {
            throw new IllegalArgumentException("Você não pode adicionar a si mesmo.");
        }

        Optional<Amizade> amizadeExistente = amizadeRepository.findAmizadeEntreUsuarios(solicitante, solicitado); //

        if (amizadeExistente.isPresent()) {
            StatusAmizade status = amizadeExistente.get().getStatus();
            if (status == StatusAmizade.ACEITO) { //
                throw new IllegalStateException("Vocês já são amigos.");
            } else if (status == StatusAmizade.PENDENTE) {
                throw new IllegalStateException("Já existe uma solicitação pendente entre vocês.");
            }
        }

        Amizade novaSolicitacao = new Amizade();
        novaSolicitacao.setSolicitante(solicitante); //
        novaSolicitacao.setSolicitado(solicitado); //
        novaSolicitacao.setStatus(StatusAmizade.PENDENTE);
        novaSolicitacao.setDataSolicitacao(LocalDateTime.now());
        Amizade solicitacaoSalva = amizadeRepository.save(novaSolicitacao);

        String mensagem = String.format("enviou um pedido de amizade.");
        notificacaoService.criarNotificacao(
                solicitado,
                solicitante,
                mensagem,
                "PEDIDO_AMIZADE",
                solicitacaoSalva.getId()
        );
    }

    @Transactional
    public void aceitarSolicitacao(Long amizadeId, Usuario usuarioLogado) {
        Amizade amizade = amizadeRepository.findById(amizadeId)
                .orElseThrow(() -> new RuntimeException("Solicitação não encontrada."));

        if (!amizade.getSolicitado().getId().equals(usuarioLogado.getId())) {
            throw new SecurityException("Ação não permitida.");
        }

        if (amizade.getStatus() != StatusAmizade.PENDENTE) {
            throw new IllegalArgumentException("Esta solicitação não está mais pendente.");
        }

        amizade.setStatus(StatusAmizade.ACEITO); //
        amizadeRepository.save(amizade);

        String mensagem = String.format("aceitou seu pedido de amizade.");
        notificacaoService.criarNotificacao(
                amizade.getSolicitante(),
                usuarioLogado,
                mensagem,
                "AMIZADE_ACEITA",
                amizade.getId()
        );
    }

    @Transactional
    public void recusarOuRemoverAmizade(Long amizadeId, Usuario usuarioLogado) {
        Amizade amizade = amizadeRepository.findById(amizadeId)
                .orElseThrow(() -> new RuntimeException("Relação não encontrada."));

        boolean isParte = amizade.getSolicitado().getId().equals(usuarioLogado.getId()) ||
                amizade.getSolicitante().getId().equals(usuarioLogado.getId());

        if (!isParte) {
            throw new SecurityException("Ação não permitida.");
        }

        Usuario outroUsuario = amizade.getSolicitante().getId().equals(usuarioLogado.getId())
                ? amizade.getSolicitado()
                : amizade.getSolicitante();

        StatusAmizade statusAnterior = amizade.getStatus();

        amizadeRepository.delete(amizade);

        if (statusAnterior == StatusAmizade.PENDENTE) {
            if (amizade.getSolicitado().getId().equals(usuarioLogado.getId())) {
                String msgRecusa = String.format("recusou seu pedido de amizade.");
                notificacaoService.criarNotificacao(outroUsuario, usuarioLogado, msgRecusa, "AMIZADE_RECUSADA", amizade.getId());
            }
        } else if (statusAnterior == StatusAmizade.ACEITO) { //
            String msgDesfeita = String.format("desfez a amizade com você.");
            notificacaoService.criarNotificacao(outroUsuario, usuarioLogado, msgDesfeita, "AMIZADE_DESFEITA", amizade.getId());
        }
    }

    public List<SolicitacaoAmizadeDTO> listarSolicitacoesPendentes(Usuario usuarioLogado) {
        List<Amizade> solicitacoes = amizadeRepository.findBySolicitadoAndStatus(usuarioLogado, StatusAmizade.PENDENTE); //
        return solicitacoes.stream()
                .map(SolicitacaoAmizadeDTO::fromEntity) //
                .collect(Collectors.toList());
    }

    public List<SolicitacaoEnviadaDTO> listarSolicitacoesEnviadas(Usuario usuarioLogado) {
        List<Amizade> solicitacoes = amizadeRepository.findBySolicitanteAndStatus(usuarioLogado, StatusAmizade.PENDENTE); //
        return solicitacoes.stream()
                .map(amizade -> new SolicitacaoEnviadaDTO( //
                        amizade.getId(),
                        amizade.getSolicitado().getId(),
                        amizade.getSolicitado().getNome(),
                        getFotoUrl(amizade.getSolicitado()),
                        amizade.getDataSolicitacao()))
                .collect(Collectors.toList());
    }

    public List<AmigoDTO> listarAmigos(Usuario usuarioLogado) {
        List<Amizade> amizades = amizadeRepository.findAmigosByUsuario(usuarioLogado); //
        return amizades.stream()
                .map(amizade -> {
                    Usuario amigo = amizade.getSolicitante().getId().equals(usuarioLogado.getId())
                            ? amizade.getSolicitado()
                            : amizade.getSolicitante();
                    boolean isOnline = userStatusService.isOnline(amigo.getEmail());
                    return new AmigoDTO(amizade.getId(), amigo, isOnline); //
                })
                .collect(Collectors.toList());
    }

    public List<AmigoDTO> listarAmigosOnline(Usuario usuarioLogado) {
        List<AmigoDTO> todosOsAmigos = this.listarAmigos(usuarioLogado);
        return todosOsAmigos.stream()
                .filter(AmigoDTO::isOnline) //
                .collect(Collectors.toList());
    }

    private String getFotoUrl(Usuario usuario) {
        if (usuario.getFotoPerfil() != null && !usuario.getFotoPerfil().isBlank()) {
            return "/api/arquivos/" + usuario.getFotoPerfil();
        }
        return null;
    }

    // --- MÉTODO CORRIGIDO ---
    // Removida a verificação de 'MESMO_USUARIO'
    public UsuarioBuscaDTO.StatusAmizadeRelacao getStatusAmizadeComUsuario(Usuario usuarioLogado, Usuario usuarioPerfil) {
        // A verificação if (usuarioLogado.getId().equals(usuarioPerfil.getId()))
        // foi REMOVIDA. Ela deve ser feita no UsuarioController.

        Optional<Amizade> amizadeOpt = amizadeRepository.findAmizadeEntreUsuarios(usuarioLogado, usuarioPerfil); //

        if (amizadeOpt.isEmpty()) {
            return UsuarioBuscaDTO.StatusAmizadeRelacao.NENHUMA; //
        }

        Amizade amizade = amizadeOpt.get();
        switch (amizade.getStatus()) {
            case ACEITO: //
                return UsuarioBuscaDTO.StatusAmizadeRelacao.AMIGOS; //
            case PENDENTE:
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