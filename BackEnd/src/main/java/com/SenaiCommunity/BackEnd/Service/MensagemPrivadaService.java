package com.SenaiCommunity.BackEnd.Service;

import com.SenaiCommunity.BackEnd.DTO.ConversaResumoDTO;
import com.SenaiCommunity.BackEnd.DTO.MensagemPrivadaEntradaDTO;
import com.SenaiCommunity.BackEnd.DTO.MensagemPrivadaSaidaDTO;
import com.SenaiCommunity.BackEnd.Entity.MensagemPrivada;
import com.SenaiCommunity.BackEnd.Entity.Usuario;
import com.SenaiCommunity.BackEnd.Repository.MensagemPrivadaRepository;
import com.SenaiCommunity.BackEnd.Repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Service
public class MensagemPrivadaService {

    @Autowired
    private MensagemPrivadaRepository mensagemPrivadaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private NotificacaoService notificacaoService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;


    private void notificarAtualizacaoContagemNaoLida(Usuario usuario) {
        if (usuario == null || usuario.getEmail() == null) return;

        long contagem = mensagemPrivadaRepository.countByDestinatarioAndLidaIsFalse(usuario);

        // Constrói o destino manualmente para corresponder à inscrição do frontend
        String destination = "/user/" + usuario.getEmail() + "/queue/contagem";

        // Usa convertAndSend com o destino completo
        messagingTemplate.convertAndSend(destination, contagem);
    }


    private MensagemPrivadaSaidaDTO toDTO(MensagemPrivada mensagem) {
        return MensagemPrivadaSaidaDTO.builder()
                .id(mensagem.getId())
                .conteudo(mensagem.getConteudo())
                .dataEnvio(mensagem.getDataEnvio())
                .remetenteId(mensagem.getRemetente().getId())
                .nomeRemetente(mensagem.getRemetente().getNome())
                .remetenteEmail(mensagem.getRemetente().getEmail())
                .destinatarioId(mensagem.getDestinatario().getId())
                .nomeDestinatario(mensagem.getDestinatario().getNome())
                .destinatarioEmail(mensagem.getDestinatario().getEmail())
                .lida(mensagem.isLida())
                .build();
    }

    private MensagemPrivada toEntity(MensagemPrivadaEntradaDTO dto, Usuario remetente, Usuario destinatario) {
        return MensagemPrivada.builder()
                .conteudo(dto.getConteudo())
                .dataEnvio(LocalDateTime.now())
                .remetente(remetente)
                .destinatario(destinatario)
                .build();
    }

    @Transactional
    public MensagemPrivadaSaidaDTO salvarMensagemPrivada(MensagemPrivadaEntradaDTO dto, String remetenteUsername) {
        Usuario remetente = usuarioRepository.findByEmail(remetenteUsername)
                .orElseThrow(() -> new NoSuchElementException("Remetente não encontrado"));
        Usuario destinatario = usuarioRepository.findById(dto.getDestinatarioId())
                .orElseThrow(() -> new NoSuchElementException("Destinatário não encontrado"));

        MensagemPrivada novaMensagem = toEntity(dto, remetente, destinatario);
        MensagemPrivada mensagemSalva = mensagemPrivadaRepository.save(novaMensagem);

        notificacaoService.criarNotificacao(
                destinatario,
                "Você recebeu uma nova mensagem de " + remetente.getNome()
        );

        notificarAtualizacaoContagemNaoLida(destinatario);

        return toDTO(mensagemSalva);
    }

    /**
     * Busca um resumo de todas as conversas do usuário logado.
     */
    @Transactional(readOnly = true)
    public List<ConversaResumoDTO> buscarResumoConversas(String usuarioLogadoUsername) {

        Usuario usuarioLogado = usuarioRepository.findByEmail(usuarioLogadoUsername)
                .orElseThrow(() -> new NoSuchElementException("Usuário logado não encontrado"));

        List<MensagemPrivada> ultimasMensagens = mensagemPrivadaRepository.findUltimasMensagensPorConversa(usuarioLogado.getId());

        return ultimasMensagens.stream()
                .map(mensagem -> {
                    Usuario outroUsuario;
                    if (mensagem.getRemetente().getId().equals(usuarioLogado.getId())) {
                        outroUsuario = mensagem.getDestinatario();
                    } else {
                        outroUsuario = mensagem.getRemetente();
                    }

                    String urlFoto = "/images/default-avatar.jpg"; // Padrão
                    if (outroUsuario.getFotoPerfil() != null && !outroUsuario.getFotoPerfil().isBlank()) {
                        urlFoto = "/api/arquivos/" + outroUsuario.getFotoPerfil();
                    }

                    return ConversaResumoDTO.builder()
                            .outroUsuarioId(outroUsuario.getId())
                            .nomeOutroUsuario(outroUsuario.getNome())
                            .emailOutroUsuario(outroUsuario.getEmail())
                            .fotoPerfilOutroUsuario(urlFoto)
                            .ultimaMensagemId(mensagem.getId())
                            .conteudoUltimaMensagem(mensagem.getConteudo())
                            .dataEnvioUltimaMensagem(mensagem.getDataEnvio())
                            .remetenteUltimaMensagemId(mensagem.getRemetente().getId())
                            .build();
                })
                .collect(Collectors.toList());
    }

    public long contarMensagensNaoLidas(String userEmail) {
        Usuario usuario = usuarioRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NoSuchElementException("Usuário não encontrado: " + userEmail));
        return mensagemPrivadaRepository.countByDestinatarioAndLidaIsFalse(usuario);
    }

    @Transactional
    public void marcarConversaComoLida(String emailUsuarioLogado, Long idRemetente) {
        Usuario usuarioLogado = usuarioRepository.findByEmail(emailUsuarioLogado)
                .orElseThrow(() -> new NoSuchElementException("Usuário logado não encontrado: " + emailUsuarioLogado));
        Usuario remetente = usuarioRepository.findById(idRemetente)
                .orElseThrow(() -> new NoSuchElementException("Remetente não encontrado com ID: " + idRemetente));

        mensagemPrivadaRepository.marcarComoLidas(usuarioLogado, remetente);

        notificarAtualizacaoContagemNaoLida(usuarioLogado);
    }

    public MensagemPrivadaSaidaDTO editarMensagemPrivada(Long id, String novoConteudo, String autorUsername) {
        MensagemPrivada mensagem = mensagemPrivadaRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Mensagem não encontrada"));

        if (!mensagem.getRemetente().getEmail().equals(autorUsername)) {
            throw new SecurityException("Você não pode editar esta mensagem.");
        }

        mensagem.setConteudo(novoConteudo);
        MensagemPrivada mensagemSalva = mensagemPrivadaRepository.save(mensagem);
        return toDTO(mensagemSalva);
    }

    public MensagemPrivadaSaidaDTO excluirMensagemPrivada(Long id, String autorUsername) {
        MensagemPrivada mensagem = mensagemPrivadaRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Mensagem não encontrada"));

        if (!mensagem.getRemetente().getEmail().equals(autorUsername)) {
            throw new SecurityException("Você не pode excluir esta mensagem.");
        }

        mensagemPrivadaRepository.delete(mensagem);
        return toDTO(mensagem);
    }

    public List<MensagemPrivadaSaidaDTO> buscarMensagensPrivadas(Long user1, Long user2) {
        List<MensagemPrivada> mensagens = mensagemPrivadaRepository.findMensagensEntreUsuarios(user1, user2);
        return mensagens.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
}