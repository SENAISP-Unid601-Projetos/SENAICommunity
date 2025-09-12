package com.SenaiCommunity.BackEnd.Service;

import com.SenaiCommunity.BackEnd.DTO.ComentarioSaidaDTO;
import com.SenaiCommunity.BackEnd.DTO.PostagemEntradaDTO;
import com.SenaiCommunity.BackEnd.DTO.PostagemSaidaDTO;
import com.SenaiCommunity.BackEnd.Entity.ArquivoMidia;
import com.SenaiCommunity.BackEnd.Entity.Postagem;
import com.SenaiCommunity.BackEnd.Entity.Usuario;
import com.SenaiCommunity.BackEnd.Repository.PostagemRepository;
import com.SenaiCommunity.BackEnd.Repository.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class PostagemService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PostagemRepository postagemRepository;

    @Autowired
    private ArquivoMidiaService midiaService;

    @Transactional
    public PostagemSaidaDTO criarPostagem(String autorUsername, PostagemEntradaDTO dto, List<MultipartFile> arquivos) {
        Usuario autor = usuarioRepository.findByEmail(autorUsername)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        // Lógica de conversão DTO -> Entidade
        Postagem novaPostagem = toEntity(dto, autor);

        // Processa os arquivos de mídia, se existirem
        if (arquivos != null && !arquivos.isEmpty()) {
            List<ArquivoMidia> midias = new ArrayList<>();
            for (MultipartFile file : arquivos) {
                try {
                    String url = midiaService.upload(file);
                    ArquivoMidia midia = ArquivoMidia.builder()
                            .url(url)
                            .tipo(midiaService.detectarTipoPelaUrl(url))
                            .postagem(novaPostagem) // Associa a mídia à postagem
                            .build();
                    midias.add(midia);
                } catch (IOException e) {
                    throw new RuntimeException("Erro ao fazer upload do arquivo: " + file.getOriginalFilename(), e);
                }
            }
            novaPostagem.setArquivos(midias);
        }

        Postagem postagemSalva = postagemRepository.save(novaPostagem);
        return toDTO(postagemSalva);
    }

    @Transactional
    public PostagemSaidaDTO editarPostagem(Long id, String username, PostagemEntradaDTO dto, List<MultipartFile> novosArquivos) {
        Postagem postagem = buscarPorId(id);

        if (!postagem.getAutor().getEmail().equals(username)) {
            throw new SecurityException("Você não pode editar esta postagem.");
        }

        // 1. Atualiza o conteúdo do texto
        postagem.setConteudo(dto.getConteudo());

        // 2. Remove arquivos antigos, se solicitado
        if (dto.getUrlsParaRemover() != null && !dto.getUrlsParaRemover().isEmpty()) {
            // Cria um Set com as URLs a serem removidas para uma busca mais rápida (O(1))
            Set<String> urlsParaRemover = Set.copyOf(dto.getUrlsParaRemover());

            // Itera sobre a lista de arquivos da postagem
            postagem.getArquivos().removeIf(arquivo -> {
                // Verifica se a URL do arquivo atual está na lista de remoção
                if (urlsParaRemover.contains(arquivo.getUrl())) {
                    try {
                        // Se estiver, deleta do serviço de nuvem (Cloudinary)
                        midiaService.deletar(arquivo.getUrl());
                        return true; // Retorna true para que o removeIf remova este item da lista
                    } catch (IOException e) {
                        System.err.println("Erro ao deletar arquivo do Cloudinary: " + arquivo.getUrl());
                        return false; // Não remove se falhou ao deletar da nuvem, para evitar inconsistência
                    }
                }
                return false; // Mantém o arquivo se a URL não estiver na lista de remoção
            });
        }

        // 3. Adiciona novos arquivos, se enviados
        if (novosArquivos != null && !novosArquivos.isEmpty()) {
            for (MultipartFile file : novosArquivos) {
                try {
                    String url = midiaService.upload(file);
                    ArquivoMidia midia = ArquivoMidia.builder()
                            .url(url)
                            .tipo(midiaService.detectarTipoPelaUrl(url))
                            .postagem(postagem)
                            .build();
                    postagem.getArquivos().add(midia);
                } catch (IOException e) {
                    throw new RuntimeException("Erro ao fazer upload do novo arquivo: " + file.getOriginalFilename(), e);
                }
            }
        }

        Postagem atualizada = postagemRepository.save(postagem);
        return toDTO(atualizada);
    }

    @Transactional
    public void excluirPostagem(Long id, String username) {
        Postagem postagem = buscarPorId(id);

        if (!postagem.getAutor().getEmail().equals(username)) {
            throw new SecurityException("Você não pode excluir esta postagem.");
        }

        // Deleta os arquivos associados no Cloudinary
        if (postagem.getArquivos() != null && !postagem.getArquivos().isEmpty()) {
            // Itera sobre uma cópia da lista para evitar problemas de modificação concorrente
            for (ArquivoMidia midia : new ArrayList<>(postagem.getArquivos())) {
                try {
                    midiaService.deletar(midia.getUrl());
                } catch (Exception e) {
                    // Loga o erro mas continua o processo para não impedir a exclusão no banco
                    System.err.println("AVISO: Falha ao deletar arquivo no Cloudinary: " + midia.getUrl() + ". Erro: " + e.getMessage());
                }
            }
        }

        // Deleta a postagem do banco de dados
        postagemRepository.deleteById(id);
    }

    public List<PostagemSaidaDTO> buscarPostagensPublicas() {
        List<Postagem> posts = postagemRepository.findTop50ByOrderByDataPostagemDesc();

        // Converte cada Postagem da lista para um PostagemSaidaDTO
        return posts.stream()
                .map(this::toDTO) // Usa o método de conversão que você já tem!
                .collect(Collectors.toList());
    }

    public Postagem buscarPorId(Long id) {
        return postagemRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Postagem não encontrada"));
    }

    public PostagemSaidaDTO ordenarComentarios(PostagemSaidaDTO postagem) {
        if (postagem.getComentarios() != null && !postagem.getComentarios().isEmpty()) {
            // Ordenar comentários: destacados primeiro, depois por data
            List<ComentarioSaidaDTO> comentariosOrdenados = postagem.getComentarios().stream()
                    .sorted((a, b) -> {
                        if (a.isDestacado() != b.isDestacado()) {
                            return Boolean.compare(b.isDestacado(), a.isDestacado()); // Destacados primeiro
                        }
                        return a.getDataCriacao().compareTo(b.getDataCriacao()); // Mais antigos primeiro
                    })
                    .collect(Collectors.toList());

            postagem.setComentarios(comentariosOrdenados);
        }
        return postagem;
    }

    //  MÉTODO PARA BUSCAR UMA POSTAGEM ESPECÍFICA COM COMENTÁRIOS
    public PostagemSaidaDTO buscarPostagemPorIdComComentarios(Long id) {
        Postagem postagem = postagemRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Postagem não encontrada com o ID: " + id));
        return toDTO(postagem); // A mágica acontece no método de conversão toDTO
    }

    // Lógica de conversão Entidade -> DTO de Saída
    // Em PostagemService.java

    private PostagemSaidaDTO toDTO(Postagem postagem) {
        // Converte a lista de entidades ArquivoMidia para uma lista de Strings (URLs)
        List<String> urls = postagem.getArquivos() != null
                ? postagem.getArquivos().stream().map(ArquivoMidia::getUrl).collect(Collectors.toList())
                : Collections.emptyList();

        // Lógica para obter o ID do usuário logado (usado tanto para a postagem quanto para os comentários)
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        final Long usuarioLogadoId = usuarioRepository.findByEmail(username)
                .map(Usuario::getId)
                .orElse(null);

        List<ComentarioSaidaDTO> comentariosDTO = postagem.getComentarios() != null
                ? postagem.getComentarios().stream().map(comentario -> {

            // 1. Calcular o total de curtidas para CADA comentário
            int totalCurtidasComentario = comentario.getCurtidas() != null ? comentario.getCurtidas().size() : 0;

            // 2. Verificar se o usuário logado curtiu CADA comentário
            boolean curtidoPeloUsuarioComentario = false;
            if (usuarioLogadoId != null && comentario.getCurtidas() != null) {
                curtidoPeloUsuarioComentario = comentario.getCurtidas().stream()
                        .anyMatch(curtida -> curtida.getUsuario().getId().equals(usuarioLogadoId));
            }

            // 3. Construir o DTO do comentário com todos os campos
            return ComentarioSaidaDTO.builder()
                    .id(comentario.getId())
                    .conteudo(comentario.getConteudo())
                    .dataCriacao(comentario.getDataCriacao())
                    .autorId(comentario.getAutor().getId())
                    .nomeAutor(comentario.getAutor().getNome())
                    .postagemId(comentario.getPostagem().getId())
                    .parentId(comentario.getParent() != null ? comentario.getParent().getId() : null)
                    .replyingToName(comentario.getParent() != null ? comentario.getParent().getAutor().getNome() : null)
                    .destacado(comentario.isDestacado())
                    .totalCurtidas(totalCurtidasComentario)
                    .curtidoPeloUsuario(curtidoPeloUsuarioComentario)
                    .urlFotoAutor(comentario.getAutor().getFotoPerfil())
                    .build();

        }).collect(Collectors.toList())
                : Collections.emptyList();

        // Lógica para as curtidas da POSTAGEM
        int totalCurtidasPostagem = postagem.getCurtidas() != null ? postagem.getCurtidas().size() : 0;
        boolean curtidoPeloUsuarioPostagem = false;
        if (usuarioLogadoId != null && postagem.getCurtidas() != null) {
            curtidoPeloUsuarioPostagem = postagem.getCurtidas().stream()
                    .anyMatch(c -> c.getUsuario().getId().equals(usuarioLogadoId));
        }

        return PostagemSaidaDTO.builder()
                .id(postagem.getId())
                .conteudo(postagem.getConteudo())
                .dataCriacao(postagem.getDataPostagem())
                .autorId(postagem.getAutor().getId())
                .nomeAutor(postagem.getAutor().getNome())
                .urlsMidia(urls)
                .comentarios(comentariosDTO)
                .totalCurtidas(totalCurtidasPostagem)
                .urlFotoAutor(postagem.getAutor().getFotoPerfil())
                .curtidoPeloUsuario(curtidoPeloUsuarioPostagem)
                .build();
    }

    // Lógica de conversão DTO de Entrada -> Entidade
    private Postagem toEntity(PostagemEntradaDTO dto, Usuario autor) {
        return Postagem.builder()
                .conteudo(dto.getConteudo())
                .dataPostagem(LocalDateTime.now())
                .autor(autor)
                .build();
    }
}
