package com.SenaiCommunity.BackEnd.Service;

import com.SenaiCommunity.BackEnd.DTO.NotificacaoSaidaDTO;
import com.SenaiCommunity.BackEnd.Entity.Notificacao;
import com.SenaiCommunity.BackEnd.Entity.Usuario;
import com.SenaiCommunity.BackEnd.Repository.NotificacaoRepository;
import com.SenaiCommunity.BackEnd.Repository.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificacaoService {

    @Autowired
    private NotificacaoRepository notificacaoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    /**
     * MÉTODO DE CONVERSÃO
     */
    private NotificacaoSaidaDTO toDTO(Notificacao notificacao) {
        return NotificacaoSaidaDTO.builder()
                .id(notificacao.getId())
                .mensagem(notificacao.getMensagem())
                .dataCriacao(notificacao.getDataCriacao())
                .lida(notificacao.isLida())
                .tipo(notificacao.getTipo() != null ? notificacao.getTipo() : "GERAL")
                .idReferencia(notificacao.getIdReferencia())
                .build();
    }

    @Transactional
    public void criarNotificacao(Usuario destinatario, String mensagem, String tipo, Long idReferencia) {
        Notificacao notificacao = Notificacao.builder()
                .destinatario(destinatario)
                .mensagem(mensagem)
                .dataCriacao(LocalDateTime.now())
                .tipo(tipo)
                .idReferencia(idReferencia)
                .build();

        Notificacao notificacaoSalva = notificacaoRepository.save(notificacao);

        NotificacaoSaidaDTO dto = toDTO(notificacaoSalva);

        messagingTemplate.convertAndSendToUser(
                destinatario.getEmail(),
                "/queue/notifications",
                dto
        );
    }

    // Sobrecarga para notificações gerais, que não quebrarão mais.
    public void criarNotificacao(Usuario destinatario, String mensagem) {
        criarNotificacao(destinatario, mensagem, "GERAL", null);
    }

    public List<NotificacaoSaidaDTO> buscarPorDestinatario(String emailDestinatario) {
        Usuario destinatario = usuarioRepository.findByEmail(emailDestinatario)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado."));

        List<Notificacao> notificacoes = notificacaoRepository.findByDestinatarioOrderByDataCriacaoDesc(destinatario);

        return notificacoes.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public void marcarComoLida(Long notificacaoId, String emailUsuarioLogado) {
        Notificacao notificacao = notificacaoRepository.findById(notificacaoId)
                .orElseThrow(() -> new EntityNotFoundException("Notificação não encontrada."));

        if (!notificacao.getDestinatario().getEmail().equals(emailUsuarioLogado)) {
            throw new SecurityException("Acesso negado. Você não pode alterar esta notificação.");
        }

        notificacao.setLida(true);
        notificacaoRepository.save(notificacao);
    }

    @Transactional
    public void marcarTodasComoLidas(String emailUsuarioLogado) {
        Usuario destinatario = usuarioRepository.findByEmail(emailUsuarioLogado)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado com o email: " + emailUsuarioLogado));

        List<Notificacao> notificacoesNaoLidas = notificacaoRepository.findByDestinatarioAndLidaIsFalse(destinatario);

        if (!notificacoesNaoLidas.isEmpty()) {
            for (Notificacao notificacao : notificacoesNaoLidas) {
                notificacao.setLida(true);
            }
            notificacaoRepository.saveAll(notificacoesNaoLidas);
        }
    }
}