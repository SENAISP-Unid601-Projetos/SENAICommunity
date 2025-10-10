package com.SenaiCommunity.BackEnd.Service;

import com.SenaiCommunity.BackEnd.DTO.MensagemProjetoSaidaDTO;
import com.SenaiCommunity.BackEnd.Entity.ArquivoMensagemProjeto;
import com.SenaiCommunity.BackEnd.Entity.MensagemProjeto;
import com.SenaiCommunity.BackEnd.Entity.Projeto;
import com.SenaiCommunity.BackEnd.Entity.Usuario;
import com.SenaiCommunity.BackEnd.Repository.MensagemProjetoRepository;
import com.SenaiCommunity.BackEnd.Repository.ProjetoMembroRepository;
import com.SenaiCommunity.BackEnd.Repository.ProjetoRepository;
import com.SenaiCommunity.BackEnd.Repository.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class MensagemProjetoService {

    @Autowired
    private UsuarioRepository usuarioRepository;
    @Autowired
    private ProjetoRepository projetoRepository;
    @Autowired
    private MensagemProjetoRepository mensagemProjetoRepository;
    @Autowired
    private NotificacaoService notificacaoService;
    @Autowired
    private ArquivoMidiaService midiaService;
    @Autowired
    private ProjetoMembroRepository projetoMembroRepository;

    private MensagemProjetoSaidaDTO toDTO(MensagemProjeto mensagem) {
        List<String> urls = mensagem.getArquivos() != null
                ? mensagem.getArquivos().stream().map(ArquivoMensagemProjeto::getUrl).collect(Collectors.toList())
                : Collections.emptyList();

        return MensagemProjetoSaidaDTO.builder()
                .id(mensagem.getId())
                .conteudo(mensagem.getConteudo())
                .dataEnvio(mensagem.getDataEnvio())
                .projetoId(mensagem.getProjeto().getId())
                .autorId(mensagem.getAutor().getId())
                .nomeAutor(mensagem.getAutor().getNome())
                .urlFotoAutor(mensagem.getAutor().getFotoPerfil())
                .urlsMidia(urls)
                .build();
    }

    @Transactional
    public MensagemProjetoSaidaDTO salvarMensagem(String autorUsername, Long projetoId, String conteudo, List<MultipartFile> arquivos) {
        Usuario autor = usuarioRepository.findByEmail(autorUsername)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado"));

        Projeto projeto = projetoRepository.findById(projetoId)
                .orElseThrow(() -> new EntityNotFoundException("Projeto não encontrado"));

        if (!projetoMembroRepository.existsByProjetoIdAndUsuarioId(projetoId, autor.getId())) {
            throw new SecurityException("Acesso negado: você não é membro deste projeto.");
        }

        MensagemProjeto novaMensagem = MensagemProjeto.builder()
                .conteudo(conteudo)
                .dataEnvio(LocalDateTime.now())
                .projeto(projeto)
                .autor(autor)
                .build();

        if (arquivos != null && !arquivos.isEmpty()) {
            List<ArquivoMensagemProjeto> midias = new ArrayList<>();
            for (MultipartFile file : arquivos) {
                try {
                    String url = midiaService.upload(file);
                    ArquivoMensagemProjeto midia = ArquivoMensagemProjeto.builder()
                            .url(url)
                            .tipo(midiaService.detectarTipoPelaUrl(url))
                            .mensagem(novaMensagem)
                            .build();
                    midias.add(midia);
                } catch (IOException e) {
                    throw new RuntimeException("Erro ao fazer upload do arquivo: " + file.getOriginalFilename(), e);
                }
            }
            novaMensagem.setArquivos(midias);
        }

        MensagemProjeto mensagemSalva = mensagemProjetoRepository.save(novaMensagem);

        // LÓGICA DE NOTIFICAÇÃO AO ENVIAR MENSAGEM
        // 1. Identificar menções no conteúdo da mensagem
        Set<String> emailsMencionados = extrairEmailsMencionados(conteudo);

        // 2. Notificar usuários mencionados
        if (!emailsMencionados.isEmpty()) {
            List<Usuario> usuariosMencionados = usuarioRepository.findAllByEmailIn(new ArrayList<>(emailsMencionados));
            String msgMencao = String.format("%s mencionou você no projeto '%s'.", autor.getNome(), projeto.getTitulo());

            usuariosMencionados.forEach(destinatario -> {
                // Apenas notifica se não for o próprio autor se mencionando
                if (!destinatario.getId().equals(autor.getId())) {
                    notificacaoService.criarNotificacao(destinatario, msgMencao, "MENSAGEM_MEMBER_MENTION", projeto.getId());
                }
            });
        }

        // 3. Notificar outros membros do grupo (que não foram mencionados)
        String msgGeral = String.format("Nova mensagem de %s no projeto '%s'.", autor.getNome(), projeto.getTitulo());
        projeto.getMembros().stream()
                .map(membro -> membro.getUsuario())
                // Filtra para não notificar o próprio autor E para não notificar quem já foi notificado por menção
                .filter(usuario -> !usuario.getId().equals(autor.getId()) && !emailsMencionados.contains(usuario.getEmail()))
                .forEach(membro -> notificacaoService.criarNotificacao(
                        membro,
                        msgGeral,
                        "NOVA_MENSAGEM_PROJETO",
                        projeto.getId()
                ));

        return toDTO(mensagemSalva);
    }

    @Transactional
    public MensagemProjetoSaidaDTO editarMensagem(Long mensagemId, String autorUsername, String novoConteudo, List<MultipartFile> novosArquivos, List<String> urlsParaRemover) {
        MensagemProjeto mensagem = mensagemProjetoRepository.findById(mensagemId)
                .orElseThrow(() -> new EntityNotFoundException("Mensagem não encontrada"));

        if (!mensagem.getAutor().getEmail().equals(autorUsername)) {
            throw new SecurityException("Você não tem permissão para editar esta mensagem.");
        }

        mensagem.setConteudo(novoConteudo);

        if (urlsParaRemover != null && !urlsParaRemover.isEmpty()) {
            Set<String> setUrlsParaRemover = Set.copyOf(urlsParaRemover);
            mensagem.getArquivos().removeIf(arquivo -> {
                if (setUrlsParaRemover.contains(arquivo.getUrl())) {
                    try {
                        midiaService.deletar(arquivo.getUrl());
                        return true;
                    } catch (IOException e) {
                        System.err.println("Erro ao deletar arquivo do Cloudinary: " + arquivo.getUrl());
                        return false;
                    }
                }
                return false;
            });
        }

        if (novosArquivos != null && !novosArquivos.isEmpty()) {
            for (MultipartFile file : novosArquivos) {
                try {
                    String url = midiaService.upload(file);
                    ArquivoMensagemProjeto midia = ArquivoMensagemProjeto.builder()
                            .url(url)
                            .tipo(midiaService.detectarTipoPelaUrl(url))
                            .mensagem(mensagem)
                            .build();
                    mensagem.getArquivos().add(midia);
                } catch (IOException e) {
                    throw new RuntimeException("Erro ao fazer upload do novo arquivo: " + file.getOriginalFilename(), e);
                }
            }
        }

        MensagemProjeto mensagemAtualizada = mensagemProjetoRepository.save(mensagem);

        // LÓGICA DE NOTIFICAÇÃO AO EDITAR MENSAGEM
        String msgEdicao = String.format("%s editou uma mensagem no projeto '%s'.", mensagem.getAutor().getNome(), mensagem.getProjeto().getTitulo());

        mensagem.getProjeto().getMembros().stream()
                .map(membro -> membro.getUsuario())
                .filter(usuario -> !usuario.getId().equals(mensagem.getAutor().getId()))
                .forEach(membro -> notificacaoService.criarNotificacao(
                        membro,
                        msgEdicao,
                        "MENSAGEM_PROJETO_EDITADA",
                        mensagem.getProjeto().getId()
                ));

        return toDTO(mensagemAtualizada);
    }

    @Transactional
    public void excluirMensagem(Long mensagemId, String autorUsername) {
        MensagemProjeto mensagem = mensagemProjetoRepository.findById(mensagemId)
                .orElseThrow(() -> new EntityNotFoundException("Mensagem não encontrada"));

        if (!mensagem.getAutor().getEmail().equals(autorUsername)) {
            throw new SecurityException("Você não tem permissão para excluir esta mensagem.");
        }

        if (mensagem.getArquivos() != null && !mensagem.getArquivos().isEmpty()) {
            for (ArquivoMensagemProjeto midia : new ArrayList<>(mensagem.getArquivos())) {
                try {
                    midiaService.deletar(midia.getUrl());
                } catch (Exception e) {
                    System.err.println("AVISO: Falha ao deletar arquivo no Cloudinary: " + midia.getUrl() + ". Erro: " + e.getMessage());
                }
            }
        }

        mensagemProjetoRepository.deleteById(mensagemId);
    }

    public List<MensagemProjetoSaidaDTO> buscarMensagensPorProjeto(Long projetoId) {
        List<MensagemProjeto> mensagens = mensagemProjetoRepository.findByProjetoIdOrderByDataEnvioAsc(projetoId);
        return mensagens.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * Extrai e-mails de menções no formato @usuario@dominio.com de um texto.
     * @param texto O conteúdo da mensagem.
     * @return Um Set de e-mails encontrados.
     */
    private Set<String> extrairEmailsMencionados(String texto) {
        if (texto == null || texto.isEmpty()) {
            return Collections.emptySet();
        }
        final Pattern pattern = Pattern.compile("@[\\w.-]+@[\\w.-]+\\.[a-zA-Z]{2,}");
        Matcher matcher = pattern.matcher(texto);
        Set<String> emails = new HashSet<>();
        while (matcher.find()) {
            emails.add(matcher.group().substring(1));
        }
        return emails;
    }
}