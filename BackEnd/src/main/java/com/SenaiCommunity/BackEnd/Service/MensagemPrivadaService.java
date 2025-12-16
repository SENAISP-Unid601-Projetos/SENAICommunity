package com.SenaiCommunity.BackEnd.Service;

import com.SenaiCommunity.BackEnd.DTO.ConversaResumoDTO;
import com.SenaiCommunity.BackEnd.DTO.MensagemPrivadaEntradaDTO;
import com.SenaiCommunity.BackEnd.DTO.MensagemPrivadaSaidaDTO;
import com.SenaiCommunity.BackEnd.Entity.MensagemPrivada;
import com.SenaiCommunity.BackEnd.Entity.Usuario;
import com.SenaiCommunity.BackEnd.Exception.ConteudoImproprioException;
import com.SenaiCommunity.BackEnd.Repository.MensagemPrivadaRepository;
import com.SenaiCommunity.BackEnd.Repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
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

    @Autowired
    private FiltroProfanidadeService filtroProfanidade;

    private void notificarAtualizacaoContagemNaoLida(Usuario usuario) {
        if (usuario == null || usuario.getEmail() == null) return;

        long contagem = mensagemPrivadaRepository.countByDestinatarioAndLidaIsFalse(usuario);

        String destination = "/user/" + usuario.getEmail() + "/queue/contagem";

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

        if (filtroProfanidade.contemProfanidade(dto.getConteudo())) {
            throw new ConteudoImproprioException("Sua mensagem contém texto não permitido.");
        }

        Usuario remetente = usuarioRepository.findByEmail(remetenteUsername)
                .orElseThrow(() -> new NoSuchElementException("Remetente não encontrado"));
        Usuario destinatario = usuarioRepository.findById(dto.getDestinatarioId())
                .orElseThrow(() -> new NoSuchElementException("Destinatário não encontrado"));


        if (remetente.getBloqueados().contains(destinatario)) {
            throw new SecurityException("Você bloqueou este usuário e não pode enviar mensagens.");
        }
        if (destinatario.getBloqueados().contains(remetente)) {
            throw new SecurityException("Você foi bloqueado por este usuário.");
        }

        MensagemPrivada novaMensagem = toEntity(dto, remetente, destinatario);
        MensagemPrivada mensagemSalva = mensagemPrivadaRepository.save(novaMensagem);

        notificacaoService.criarNotificacao(
                destinatario,
                "Você recebeu uma nova mensagem de " + remetente.getNome(),
                "MENSAGEM_PRIVADA",
                remetente.getId()
        );

        notificarAtualizacaoContagemNaoLida(destinatario);

        return toDTO(mensagemSalva);
    }


    /**
     * Busca um resumo de todas as conversas do usuário logado,
     * FILTRANDO usuários bloqueados.
     */
    @Transactional(readOnly = true)
    public List<ConversaResumoDTO> buscarResumoConversas(String usuarioLogadoUsername) {

        Usuario usuarioLogado = usuarioRepository.findByEmail(usuarioLogadoUsername)
                .orElseThrow(() -> new NoSuchElementException("Usuário logado não encontrado"));

        List<MensagemPrivada> ultimasMensagens = mensagemPrivadaRepository.findUltimasMensagensPorConversa(usuarioLogado.getId());

        return ultimasMensagens.stream()
                // --- FILTRAGEM DE BLOQUEIO (NOVO) ---
                .filter(mensagem -> {
                    Usuario outroUsuario;
                    if (mensagem.getRemetente().getId().equals(usuarioLogado.getId())) {
                        outroUsuario = mensagem.getDestinatario();
                    } else {
                        outroUsuario = mensagem.getRemetente();
                    }

                    // Verifica se EU bloqueei ele
                    boolean euBloqueei = usuarioLogado.getBloqueados().contains(outroUsuario);

                    // Verifica se ELE me bloqueou (Opcional: se quiser esconder conversas de quem te bloqueou)
                    boolean eleMeBloqueou = outroUsuario.getBloqueados().contains(usuarioLogado);

                    // Só mostra se NINGUÉM bloqueou NINGUÉM
                    return !euBloqueei && !eleMeBloqueou;
                })
                // --- FIM DA FILTRAGEM ---
                .map(mensagem -> {
                    Usuario outroUsuario;
                    if (mensagem.getRemetente().getId().equals(usuarioLogado.getId())) {
                        outroUsuario = mensagem.getDestinatario();
                    } else {
                        outroUsuario = mensagem.getRemetente();
                    }

                    String urlFoto = "/images/default-avatar.jpg";
                    String fotoPerfilDB = outroUsuario.getFotoPerfil();

                    if (fotoPerfilDB != null && !fotoPerfilDB.isBlank()) {
                        if (fotoPerfilDB.startsWith("http://") || fotoPerfilDB.startsWith("https://")) {
                            urlFoto = fotoPerfilDB;
                        } else {
                            urlFoto = "/api/arquivos/" + fotoPerfilDB;
                        }
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
        if (filtroProfanidade.contemProfanidade(novoConteudo)) {
            throw new ConteudoImproprioException("Sua edição contém texto não permitido.");
        }

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

        var pageable = PageRequest.of(0, 50, Sort.by("dataEnvio").descending()); // Pega as 50 mais recentes

        List<MensagemPrivada> mensagens = mensagemPrivadaRepository.findMensagensEntreUsuarios(user1, user2, pageable);

        mensagens.sort((m1, m2) -> m1.getDataEnvio().compareTo(m2.getDataEnvio()));

        return mensagens.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public void bloquearUsuario(String emailBloqueador, Long idBloqueado) {
        Usuario bloqueador = usuarioRepository.findByEmail(emailBloqueador)
                .orElseThrow(() -> new NoSuchElementException("Usuário não encontrado"));
        Usuario bloqueado = usuarioRepository.findById(idBloqueado)
                .orElseThrow(() -> new NoSuchElementException("Usuário alvo não encontrado"));

        if (bloqueador.getId().equals(bloqueado.getId())) {
            throw new IllegalArgumentException("Você não pode bloquear a si mesmo.");
        }

        bloqueador.getBloqueados().add(bloqueado);
        usuarioRepository.save(bloqueador);
    }

    @Transactional
    public void desbloquearUsuario(String emailBloqueador, Long idBloqueado) {
        Usuario bloqueador = usuarioRepository.findByEmail(emailBloqueador)
                .orElseThrow(() -> new NoSuchElementException("Usuário não encontrado"));
        Usuario bloqueado = usuarioRepository.findById(idBloqueado)
                .orElseThrow(() -> new NoSuchElementException("Usuário alvo não encontrado"));

        bloqueador.getBloqueados().remove(bloqueado);
        usuarioRepository.save(bloqueador);
    }

    @Transactional(readOnly = true)
    public boolean verificarBloqueio(String emailUsuario, Long idOutroUsuario) {
        Usuario usuario = usuarioRepository.findByEmail(emailUsuario)
                .orElseThrow(() -> new NoSuchElementException("Usuário não encontrado"));
        Usuario outro = usuarioRepository.findById(idOutroUsuario)
                .orElseThrow(() -> new NoSuchElementException("Outro usuário não encontrado"));

        // Retorna true se EU bloqueei ele
        return usuario.getBloqueados().contains(outro);
    }

    @Transactional(readOnly = true)
    public boolean fuiBloqueado(String emailUsuario, Long idOutroUsuario) {
        Usuario usuario = usuarioRepository.findByEmail(emailUsuario).orElseThrow();
        Usuario outro = usuarioRepository.findById(idOutroUsuario).orElseThrow();
        // Retorna true se ELE me bloqueou
        return outro.getBloqueados().contains(usuario);
    }

    @Transactional
    public void excluirConversaInteira(String emailUsuario, Long idOutroUsuario) {
        Usuario usuario = usuarioRepository.findByEmail(emailUsuario)
                .orElseThrow(() -> new NoSuchElementException("Usuário não encontrado"));

        // Deleta todas as mensagens onde (remetente=eu e dest=ele) OU (remetente=ele e dest=eu)
        mensagemPrivadaRepository.deletarConversaEntreUsuarios(usuario.getId(), idOutroUsuario);
    }

    @Transactional(readOnly = true)
    public List<com.SenaiCommunity.BackEnd.DTO.UsuarioSaidaDTO> listarBloqueados(String emailUsuario) {
        Usuario usuario = usuarioRepository.findByEmail(emailUsuario)
                .orElseThrow(() -> new NoSuchElementException("Usuário não encontrado"));

        return usuario.getBloqueados().stream()
                .map(bloqueado -> new com.SenaiCommunity.BackEnd.DTO.UsuarioSaidaDTO(bloqueado))
                .collect(Collectors.toList());
    }
}