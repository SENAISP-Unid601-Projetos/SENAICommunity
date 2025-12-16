package com.SenaiCommunity.BackEnd.Service;

import com.SenaiCommunity.BackEnd.DTO.ComentarioSaidaDTO;
import com.SenaiCommunity.BackEnd.DTO.PostagemEntradaDTO;
import com.SenaiCommunity.BackEnd.DTO.PostagemSaidaDTO;
import com.SenaiCommunity.BackEnd.Entity.ArquivoMidia;
import com.SenaiCommunity.BackEnd.Entity.Postagem;
import com.SenaiCommunity.BackEnd.Entity.Usuario;
import com.SenaiCommunity.BackEnd.Exception.ConteudoImproprioException;
import com.SenaiCommunity.BackEnd.Repository.PostagemRepository;
import com.SenaiCommunity.BackEnd.Repository.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.*; // Import genérico para List, Set, HashSet, etc.
import java.util.stream.Collectors;

@Service
public class PostagemService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PostagemRepository postagemRepository;

    @Autowired
    private ArquivoMidiaService midiaService;

    @Autowired
    private FiltroProfanidadeService filtroProfanidade;

    @Transactional
    @CacheEvict(value = "feed-postagens", allEntries = true)
    public PostagemSaidaDTO criarPostagem(String autorUsername, PostagemEntradaDTO dto, List<MultipartFile> arquivos) {
        Usuario autor = usuarioRepository.findByEmail(autorUsername)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        if (filtroProfanidade.contemProfanidade(dto.getConteudo())) {
            throw new ConteudoImproprioException("Sua postagem contém texto não permitido.");
        }

        Postagem novaPostagem = toEntity(dto, autor);

        if (arquivos != null && !arquivos.isEmpty()) {
            // ALTERAÇÃO: Usando Set para compatibilidade com a Entidade
            Set<ArquivoMidia> midias = new HashSet<>();
            for (MultipartFile file : arquivos) {
                try {
                    String url = midiaService.upload(file);
                    ArquivoMidia midia = ArquivoMidia.builder()
                            .url(url)
                            .tipo(midiaService.detectarTipoPelaUrl(url))
                            .postagem(novaPostagem)
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
    @CacheEvict(value = "feed-postagens", allEntries = true)
    public PostagemSaidaDTO editarPostagem(Long id, String username, PostagemEntradaDTO dto, List<MultipartFile> novosArquivos) {
        Postagem postagem = buscarPorId(id);
        if (!postagem.getAutor().getEmail().equals(username)) {
            throw new SecurityException("Você não pode editar esta postagem.");
        }
        if (filtroProfanidade.contemProfanidade(dto.getConteudo())) {
            throw new ConteudoImproprioException("Sua edição contém texto não permitido.");
        }
        postagem.setConteudo(dto.getConteudo());

        if (dto.getUrlsParaRemover() != null && !dto.getUrlsParaRemover().isEmpty()) {
            Set<String> urlsParaRemover = Set.copyOf(dto.getUrlsParaRemover());
            postagem.getArquivos().removeIf(arquivo -> {
                if (urlsParaRemover.contains(arquivo.getUrl())) {
                    try {
                        midiaService.deletar(arquivo.getUrl());
                        return true;
                    } catch (IOException e) { return false; }
                }
                return false;
            });
        }

        if (novosArquivos != null && !novosArquivos.isEmpty()) {
            for (MultipartFile file : novosArquivos) {
                try {
                    String url = midiaService.upload(file);
                    ArquivoMidia midia = ArquivoMidia.builder()
                            .url(url).tipo(midiaService.detectarTipoPelaUrl(url)).postagem(postagem).build();
                    postagem.getArquivos().add(midia);
                } catch (IOException e) {
                    throw new RuntimeException("Erro upload novo arquivo", e);
                }
            }
        }
        return toDTO(postagemRepository.save(postagem));
    }

    @Transactional
    @CacheEvict(value = "feed-postagens", allEntries = true)
    public void excluirPostagem(Long id, String username) {
        Postagem postagem = buscarPorId(id);
        if (!postagem.getAutor().getEmail().equals(username)) {
            throw new SecurityException("Você não pode excluir esta postagem.");
        }
        if (postagem.getArquivos() != null) {
            postagem.getArquivos().forEach(m -> {
                try { midiaService.deletar(m.getUrl()); } catch (Exception e) {}
            });
        }
        postagemRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<PostagemSaidaDTO> buscarPostagensPublicas() {
        List<Postagem> posts = postagemRepository.findTop10ByOrderByDataPostagemDesc();
        return posts.stream().map(this::toDTO).collect(Collectors.toList());
    }

    public Postagem buscarPorId(Long id) {
        return postagemRepository.findById(id).orElseThrow(() -> new EntityNotFoundException("Postagem não encontrada"));
    }

    public PostagemSaidaDTO ordenarComentarios(PostagemSaidaDTO postagem) {
        if (postagem.getComentarios() != null && !postagem.getComentarios().isEmpty()) {
            List<ComentarioSaidaDTO> sorted = postagem.getComentarios().stream()
                    .sorted((a, b) -> {
                        if (a.isDestacado() != b.isDestacado()) return Boolean.compare(b.isDestacado(), a.isDestacado());
                        return a.getDataCriacao().compareTo(b.getDataCriacao());
                    }).collect(Collectors.toList());
            postagem.setComentarios(sorted);
        }
        return postagem;
    }

    public PostagemSaidaDTO buscarPostagemPorIdComComentarios(Long id) {
        return toDTO(buscarPorId(id));
    }

    @Transactional(readOnly = true)
    public List<PostagemSaidaDTO> buscarPostagensPorUsuario(Long usuarioId) {
        return postagemRepository.findByAutorIdOrderByDataPostagemDesc(usuarioId)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    private PostagemSaidaDTO toDTO(Postagem postagem) {
        // Converte o Set de arquivos para List<String> para o DTO
        List<String> urls = postagem.getArquivos() != null
                ? postagem.getArquivos().stream().map(ArquivoMidia::getUrl).collect(Collectors.toList())
                : Collections.emptyList();

        Long usuarioLogadoId = null;
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
                usuarioLogadoId = usuarioRepository.findByEmail(auth.getName()).map(Usuario::getId).orElse(null);
            }
        } catch (Exception e) {
            System.err.println("Erro ao identificar usuário logado: " + e.getMessage());
        }

        final Long userId = usuarioLogadoId;

        // Converte o Set de comentários para List<DTO>
        List<ComentarioSaidaDTO> comentariosDTO = postagem.getComentarios() != null
                ? postagem.getComentarios().stream().map(c -> {
            boolean curtido = false;
            if (userId != null && c.getCurtidas() != null) {
                curtido = c.getCurtidas().stream().anyMatch(l -> l.getUsuario().getId().equals(userId));
            }
            return ComentarioSaidaDTO.builder()
                    .id(c.getId())
                    .conteudo(c.getConteudo())
                    .dataCriacao(c.getDataCriacao())
                    .autorId(c.getAutor().getId())
                    .nomeAutor(c.getAutor().getNome())
                    .postagemId(c.getPostagem().getId())
                    .parentId(c.getParent() != null ? c.getParent().getId() : null)
                    .replyingToName(c.getParent() != null ? c.getParent().getAutor().getNome() : null)
                    .destacado(c.isDestacado())
                    .totalCurtidas(c.getCurtidas() != null ? c.getCurtidas().size() : 0)
                    .curtidoPeloUsuario(curtido)
                    .urlFotoAutor(c.getAutor().getFotoPerfil())
                    .build();
        }).collect(Collectors.toList()) : Collections.emptyList();

        boolean curtidoPost = false;
        if (userId != null && postagem.getCurtidas() != null) {
            curtidoPost = postagem.getCurtidas().stream().anyMatch(l -> l.getUsuario().getId().equals(userId));
        }

        return PostagemSaidaDTO.builder()
                .id(postagem.getId())
                .conteudo(postagem.getConteudo())
                .dataCriacao(postagem.getDataPostagem())
                .autorId(postagem.getAutor().getId())
                .nomeAutor(postagem.getAutor().getNome())
                .urlsMidia(urls)
                .comentarios(comentariosDTO)
                .totalCurtidas(postagem.getCurtidas() != null ? postagem.getCurtidas().size() : 0)
                .urlFotoAutor(postagem.getAutor().getFotoPerfil())
                .curtidoPeloUsuario(curtidoPost)
                .build();
    }

    private Postagem toEntity(PostagemEntradaDTO dto, Usuario autor) {
        return Postagem.builder().conteudo(dto.getConteudo()).dataPostagem(LocalDateTime.now()).autor(autor).build();
    }
}