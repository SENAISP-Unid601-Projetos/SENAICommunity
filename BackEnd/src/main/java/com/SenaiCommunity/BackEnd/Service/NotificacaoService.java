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
     * MÉTODO DE CONVERSÃO COM A CORREÇÃO DEFINITIVA
     */
    private NotificacaoSaidaDTO toDTO(Notificacao notificacao) {
        String remetenteNome = null;
        Long remetenteId = null;
        String remetenteFotoUrl = null;

        if (notificacao.getRemetente() != null) {
            remetenteId = notificacao.getRemetente().getId();
            remetenteNome = notificacao.getRemetente().getNome();

            // Pega o caminho da foto (seja "123.png" ou "/alunoPictures/foto.jpg")
            String fotoPath = notificacao.getRemetente().getFotoPerfil(); // Usa o getter correto

            if (fotoPath != null && !fotoPath.isBlank()) {

                // **********************************
                // 🚀 CORREÇÃO APLICADA AQUI
                // **********************************

                // Caso 1: O path JÁ é um caminho completo (ex: /alunoPictures/foto.jpg)
                // (Vindo do MensagemPrivadaService)
                // NÃO FAÇA NADA. Use o caminho como está.
                if (fotoPath.startsWith("/")) {
                    remetenteFotoUrl = fotoPath;
                }
                // Caso 2: O path é SÓ um nome de arquivo (ex: 123.png)
                // (Vindo do CurtidaService, como vimos na imagem que FUNCIONOU)
                // Adicione o prefixo da API.
                else {
                    remetenteFotoUrl = "/api/arquivos/" + fotoPath;
                }
            }
        }

        return NotificacaoSaidaDTO.builder()
                .id(notificacao.getId())
                .mensagem(notificacao.getMensagem())
                .dataCriacao(notificacao.getDataCriacao())
                .lida(notificacao.isLida())
                .tipo(notificacao.getTipo() != null ? notificacao.getTipo() : "GERAL")
                .idReferencia(notificacao.getIdReferencia())
                .remetenteId(remetenteId)
                .remetenteNome(remetenteNome)
                .remetenteFotoUrl(remetenteFotoUrl) // Agora envia a URL correta para AMBOS
                .build();
    }

    // ... (O RESTANTE DO SEU CÓDIGO - criarNotificacao, etc. - ESTÁ CORRETO)
    // ... (NÃO PRECISA MUDAR MAIS NADA NESTE ARQUIVO)

    @Transactional
    public void criarNotificacao(Usuario destinatario, Usuario remetente, String mensagem, String tipo, Long idReferencia) {
        // ... (seu código aqui, está correto)
        Notificacao notificacao = Notificacao.builder()
                .destinatario(destinatario)
                .remetente(remetente)
                .mensagem(mensagem)
                .dataCriacao(LocalDateTime.now())
                .tipo(tipo)
                .idReferencia(idReferencia)
                .lida(false)
                .build();

        Notificacao notificacaoSalva = notificacaoRepository.save(notificacao);
        NotificacaoSaidaDTO dto = toDTO(notificacaoSalva);
        messagingTemplate.convertAndSendToUser(
                destinatario.getEmail(),
                "/queue/notifications",
                dto
        );
    }

    public void criarNotificacao(Usuario destinatario, String mensagem) {
        // ... (seu código aqui, está correto)
        criarNotificacao(destinatario, null, mensagem, "GERAL", null);
    }

    public List<NotificacaoSaidaDTO> buscarPorDestinatario(String emailDestinatario) {
        // ... (seu código aqui, está correto)
        Usuario destinatario = usuarioRepository.findByEmail(emailDestinatario)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado."));
        List<Notificacao> notificacoes = notificacaoRepository.findByDestinatarioOrderByDataCriacaoDesc(destinatario);
        return notificacoes.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public void marcarComoLida(Long notificacaoId, String emailUsuarioLogado) {
        // ... (seu código aqui, está correto)
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
        // ... (seu código aqui, está correto)
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