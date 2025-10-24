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
        if (mensagem == null) {
            return null;
        }

        Usuario autor = mensagem.getAutor(); // Obtém o autor da mensagem
        String nomeAutor = (autor != null) ? autor.getNome() : "Desconhecido";
        Long autorId = (autor != null) ? autor.getId() : null;

        String urlFotoAutor = null;
        // Verifica se autor existe e se tem uma foto de perfil definida (não nula/vazia)
        if (autor != null && autor.getFotoPerfil() != null && !autor.getFotoPerfil().isBlank()) {
            urlFotoAutor = "/api/arquivos/" + autor.getFotoPerfil(); // Monta a URL relativa
        } else {
            // Caminho padrão relativo se não houver foto ou autor
            urlFotoAutor = "/images/default-avatar.png";
        }

        // Lógica para obter as URLs de mídia da mensagem
        List<String> urlsMidia = mensagem.getArquivos() != null
                ? mensagem.getArquivos().stream()
                .map(ArquivoMensagemProjeto::getUrl) // Pega a URL de cada arquivo anexo
                .collect(Collectors.toList())
                : Collections.emptyList(); // Retorna lista vazia se não houver anexos

        // Constrói o DTO usando os valores obtidos/construídos
        return MensagemProjetoSaidaDTO.builder()
                .id(mensagem.getId())
                .conteudo(mensagem.getConteudo())
                .dataEnvio(mensagem.getDataEnvio())
                .projetoId(mensagem.getProjeto() != null ? mensagem.getProjeto().getId() : null) // Verifica se projeto não é nulo
                .autorId(autorId)
                .nomeAutor(nomeAutor)
                .urlFotoAutor(urlFotoAutor)
                .urlsMidia(urlsMidia)
                .build();
    }
    // --- FIM DO MÉTODO toDTO MODIFICADO ---

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
                    String urlOuNomeArquivo = midiaService.upload(file);
                    ArquivoMensagemProjeto midia = ArquivoMensagemProjeto.builder()
                            .url(urlOuNomeArquivo)
                            .tipo(midiaService.detectarTipoPelaUrl(urlOuNomeArquivo))
                            .mensagem(novaMensagem)
                            .build();
                    midias.add(midia);
                } catch (IOException e) {
                    throw new RuntimeException("Erro ao fazer upload do arquivo: " + file.getOriginalFilename(), e);
                }
            }
            novaMensagem.setArquivos(midias); // Associa os arquivos à mensagem
        }

        MensagemProjeto mensagemSalva = mensagemProjetoRepository.save(novaMensagem);

        // LÓGICA DE NOTIFICAÇÃO AO ENVIAR MENSAGEM
        Set<String> emailsMencionados = extrairEmailsMencionados(conteudo);

        if (!emailsMencionados.isEmpty()) {
            List<Usuario> usuariosMencionados = usuarioRepository.findAllByEmailIn(new ArrayList<>(emailsMencionados));
            String msgMencao = String.format("%s mencionou você no projeto '%s'.", autor.getNome(), projeto.getTitulo());

            usuariosMencionados.forEach(destinatario -> {
                if (!destinatario.getId().equals(autor.getId())) { // Não notifica a si mesmo
                    notificacaoService.criarNotificacao(destinatario, autor, msgMencao, "MENSAGEM_MEMBER_MENTION", projeto.getId());
                }
            });
        }

        String msgGeral = String.format("Nova mensagem de %s no projeto '%s'.", autor.getNome(), projeto.getTitulo());
        // Busca os membros do projeto para notificar
        projetoMembroRepository.findByProjetoId(projetoId).stream()
                .map(membro -> membro.getUsuario()) // Pega o objeto Usuario de cada membro
                // Filtra para não notificar o autor e quem já foi mencionado
                .filter(usuario -> !usuario.getId().equals(autor.getId()) && !emailsMencionados.contains(usuario.getEmail()))
                .forEach(membro -> notificacaoService.criarNotificacao(
                        membro,
                        autor,
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

        // Validação de permissão
        if (!mensagem.getAutor().getEmail().equals(autorUsername)) {
            throw new SecurityException("Você não tem permissão para editar esta mensagem.");
        }

        mensagem.setConteudo(novoConteudo);

        // Garante que a lista de arquivos não seja nula antes de tentar modificá-la
        if (mensagem.getArquivos() == null) {
            mensagem.setArquivos(new ArrayList<>());
        }

        // Remove arquivos antigos
        if (urlsParaRemover != null && !urlsParaRemover.isEmpty()) {
            Set<String> setUrlsParaRemover = Set.copyOf(urlsParaRemover);
            // É mais seguro usar um Iterator para remover elementos enquanto itera
            Iterator<ArquivoMensagemProjeto> iterator = mensagem.getArquivos().iterator();
            while (iterator.hasNext()) {
                ArquivoMensagemProjeto arquivo = iterator.next();
                if (setUrlsParaRemover.contains(arquivo.getUrl())) {
                    try {
                        midiaService.deletar(arquivo.getUrl()); // Deleta do serviço de armazenamento
                        iterator.remove(); // Remove da coleção da entidade
                    } catch (IOException e) {
                        // Logar o erro é importante
                        System.err.println("Erro ao deletar arquivo: " + arquivo.getUrl() + " - " + e.getMessage());
                    }
                }
            }
        }

        // Adiciona novos arquivos
        if (novosArquivos != null && !novosArquivos.isEmpty()) {
            for (MultipartFile file : novosArquivos) {
                try {
                    String urlOuNomeArquivo = midiaService.upload(file);
                    ArquivoMensagemProjeto midia = ArquivoMensagemProjeto.builder()
                            .url(urlOuNomeArquivo)
                            .tipo(midiaService.detectarTipoPelaUrl(urlOuNomeArquivo))
                            .mensagem(mensagem) // Associa à mensagem existente
                            .build();
                    mensagem.getArquivos().add(midia); // Adiciona à lista
                } catch (IOException e) {
                    throw new RuntimeException("Erro ao fazer upload do novo arquivo: " + file.getOriginalFilename(), e);
                }
            }
        }

        MensagemProjeto mensagemAtualizada = mensagemProjetoRepository.save(mensagem);

        // LÓGICA DE NOTIFICAÇÃO AO EDITAR MENSAGEM
        String msgEdicao = String.format("%s editou uma mensagem no projeto '%s'.", mensagem.getAutor().getNome(), mensagem.getProjeto().getTitulo());

        // Busca os membros do projeto para notificar
        projetoMembroRepository.findByProjetoId(mensagem.getProjeto().getId()).stream()
                .map(membro -> membro.getUsuario())
                .filter(usuario -> !usuario.getId().equals(mensagem.getAutor().getId())) // Não notifica o próprio autor
                .forEach(membro -> notificacaoService.criarNotificacao(
                        membro,
                        mensagem.getAutor(),
                        msgEdicao,
                        "MENSAGEM_PROJETO_EDITADA",
                        mensagem.getProjeto().getId()
                ));

        // Retorna o DTO com a URL da foto corrigida
        return toDTO(mensagemAtualizada);
    }

    @Transactional
    public void excluirMensagem(Long mensagemId, String autorUsername) {
        MensagemProjeto mensagem = mensagemProjetoRepository.findById(mensagemId)
                .orElseThrow(() -> new EntityNotFoundException("Mensagem não encontrada"));

        // Validação de permissão (apenas o autor pode excluir)
        if (!mensagem.getAutor().getEmail().equals(autorUsername)) {
            throw new SecurityException("Você não tem permissão para excluir esta mensagem.");
        }

        // Deleta os arquivos associados primeiro do serviço de armazenamento
        if (mensagem.getArquivos() != null && !mensagem.getArquivos().isEmpty()) {
            // Itera sobre uma cópia da lista para segurança, embora não seja estritamente necessário aqui
            for (ArquivoMensagemProjeto midia : new ArrayList<>(mensagem.getArquivos())) {
                try {
                    midiaService.deletar(midia.getUrl());
                } catch (Exception e) {
                    // Loga o erro mas continua, para tentar deletar a mensagem do DB mesmo assim
                    System.err.println("AVISO: Falha ao deletar arquivo associado à mensagem " + mensagemId +
                            ": " + midia.getUrl() + ". Erro: " + e.getMessage());
                }
            }
        }
        // Deleta a mensagem do banco de dados.
        mensagemProjetoRepository.deleteById(mensagemId);
    }

    // Método buscarMensagensPorProjeto
    public List<MensagemProjetoSaidaDTO> buscarMensagensPorProjeto(Long projetoId) {
        // Validação se o projeto existe (opcional, mas bom)
        if (!projetoRepository.existsById(projetoId)) {
            // Ou retornar lista vazia, dependendo da preferência
            throw new EntityNotFoundException("Projeto não encontrado com ID: " + projetoId);
        }
        List<MensagemProjeto> mensagens = mensagemProjetoRepository.findByProjetoIdOrderByDataEnvioAsc(projetoId);
        return mensagens.stream()
                .map(this::toDTO) // Aplica a conversão corrigida
                .collect(Collectors.toList());
    }

    /**
     * Extrai e-mails de menções no formato @usuario@dominio.com de um texto.
     * @param texto O conteúdo da mensagem.
     * @return Um Set de e-mails encontrados (sem o '@' inicial).
     */
    private Set<String> extrairEmailsMencionados(String texto) {
        if (texto == null || texto.isBlank()) {
            return Collections.emptySet();
        }
        // Pattern para encontrar @email.valido (ajustado para ser um pouco mais flexível)
        // Considera letras, números, '.', '-', '_' no nome e domínio. Domínio TLD com 2+ letras.
        final Pattern pattern = Pattern.compile("@[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}");
        Matcher matcher = pattern.matcher(texto);
        Set<String> emails = new HashSet<>();
        while (matcher.find()) {
            emails.add(matcher.group().substring(1)); // Remove o '@' inicial
        }
        return emails;
    }
}