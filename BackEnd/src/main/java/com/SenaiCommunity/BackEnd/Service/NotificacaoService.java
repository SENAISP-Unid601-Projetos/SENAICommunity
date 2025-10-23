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
     * MÉTODO DE CONVERSÃO ATUALIZADO
     * Converte a entidade Notificacao para NotificacaoSaidaDTO,
     * incluindo os dados do "ator" (quem gerou a notificação).
     */
    private NotificacaoSaidaDTO toDTO(Notificacao notificacao) {

        Usuario ator = notificacao.getAtor();
        Long atorId = null;
        String atorNome = "Sistema"; // Padrão para notificações sem ator (ex: sistema)
        String urlFotoAtor = "/images/system-icon.png"; // Ícone padrão do sistema

        if (ator != null) {
            atorId = ator.getId();
            atorNome = ator.getNome();

            // Lógica para construir a URL da foto (similar à do MensagemProjetoService/UsuarioService)
            if (ator.getFotoPerfil() != null && !ator.getFotoPerfil().isBlank()) {
                urlFotoAtor = "/api/arquivos/" + ator.getFotoPerfil();
            } else {
                // Caminho padrão relativo se não houver foto
                urlFotoAtor = "/images/default-avatar.png"; // Avatar padrão de usuário (ajuste o caminho se necessário)
            }
        }

        return NotificacaoSaidaDTO.builder()
                .id(notificacao.getId())
                .mensagem(notificacao.getMensagem())
                .dataCriacao(notificacao.getDataCriacao())
                .lida(notificacao.isLida())
                .tipo(notificacao.getTipo() != null ? notificacao.getTipo() : "GERAL")
                .idReferencia(notificacao.getIdReferencia())
                .atorId(atorId)
                .atorNome(atorNome)
                .urlFotoAtor(urlFotoAtor)
                .build();
    }

    /**
     * Cria uma notificação e a envia via WebSocket.
     * @param destinatario Quem receberá a notificação.
     * @param ator Quem realizou a ação (pode ser null para ações do sistema).
     * @param mensagem O texto da notificação.
     * @param tipo O tipo da notificação (ex: "CONVITE_PROJETO").
     * @param idReferencia ID relacionado à notificação (ex: ID do projeto).
     */
    @Transactional
    public void criarNotificacao(
            Usuario destinatario,
            Usuario ator,
            String mensagem,
            String tipo,
            Long idReferencia) {

        Notificacao notificacao = Notificacao.builder()
                .destinatario(destinatario)
                .ator(ator)
                .mensagem(mensagem)
                .dataCriacao(LocalDateTime.now())
                .tipo(tipo)
                .idReferencia(idReferencia)
                .build();

        Notificacao notificacaoSalva = notificacaoRepository.save(notificacao);

        // Converte para o DTO
        NotificacaoSaidaDTO dto = toDTO(notificacaoSalva);

        // Envia para o usuário específico via WebSocket
        // O destinatario.getEmail() é usado como o "username" no SimpMessagingTemplate
        messagingTemplate.convertAndSendToUser(
                destinatario.getEmail(),
                "/queue/notifications",
                dto
        );
    }

    /**
     * Sobrecarga para notificações do sistema (sem um "ator" usuário).
     * O ator será 'null', e o toDTO() tratará como "Sistema".
     */
    public void criarNotificacao(Usuario destinatario, String mensagem) {
        // Passa null para o ator
        criarNotificacao(destinatario, null, mensagem, "GERAL", null);
    }

    /**
     * Busca todas as notificações de um usuário.
     */
    public List<NotificacaoSaidaDTO> buscarPorDestinatario(String emailDestinatario) {
        Usuario destinatario = usuarioRepository.findByEmail(emailDestinatario)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado."));

        List<Notificacao> notificacoes = notificacaoRepository.findByDestinatarioOrderByDataCriacaoDesc(destinatario);

        return notificacoes.stream()
                .map(this::toDTO) // Aplica a conversão que agora inclui o ator
                .collect(Collectors.toList());
    }

    /**
     * Marca uma notificação específica como lida.
     */
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

    /**
     * Marca todas as notificações não lidas de um usuário como lidas.
     */
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