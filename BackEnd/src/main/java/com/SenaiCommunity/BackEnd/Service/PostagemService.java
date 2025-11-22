package com.SenaiCommunity.BackEnd.Service;

import com.SenaiCommunity.BackEnd.DTO.*;
import java.util.Comparator;
import com.SenaiCommunity.BackEnd.DTO.UsuarioSimplesDTO;
import com.SenaiCommunity.BackEnd.DTO.ArquivoMidiaDTO;
import com.SenaiCommunity.BackEnd.DTO.ComentarioSaidaDTO;
import com.SenaiCommunity.BackEnd.DTO.UsuarioSimplesDTO;
import com.SenaiCommunity.BackEnd.Entity.ArquivoMidia;
import com.SenaiCommunity.BackEnd.Entity.Comentario;
import com.SenaiCommunity.BackEnd.Entity.Postagem;
import com.SenaiCommunity.BackEnd.Entity.Usuario;
import com.SenaiCommunity.BackEnd.Repository.PostagemRepository;
import com.SenaiCommunity.BackEnd.Repository.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.messaging.simp.SimpMessagingTemplate; // Não é usado aqui
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
import java.util.Comparator; // ✅ Import Adicionado (para ordenar comentários)


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

        Postagem novaPostagem = toEntity(dto, autor);

        if (arquivos != null && !arquivos.isEmpty()) {
            List<ArquivoMidia> midias = new ArrayList<>();
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
                    // ✅ MUDANÇA: Lança a RuntimeException com a MENSAGEM ORIGINAL do erro (e.getMessage())
                    // Isso garantirá que nosso "O upload de vídeos está..." chegue ao frontend.
                    throw new RuntimeException("Erro ao fazer upload do arquivo: " + file.getOriginalFilename() + ". Causa: " + e.getMessage(), e);
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

        postagem.setConteudo(dto.getConteudo());

        if (dto.getUrlsParaRemover() != null && !dto.getUrlsParaRemover().isEmpty()) {
            Set<String> urlsParaRemover = Set.copyOf(dto.getUrlsParaRemover());
            postagem.getArquivos().removeIf(arquivo -> {
                if (urlsParaRemover.contains(arquivo.getUrl())) {
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

        // Obter roles do usuário logado
        var authorities = SecurityContextHolder.getContext().getAuthentication().getAuthorities();

        boolean isAdmin = authorities.stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMIN"));

        // ✅ Verificar se é Supervisor
        boolean isSupervisor = authorities.stream()
                .anyMatch(auth -> auth.getAuthority().equals("ROLE_SUPERVISOR"));

        // ✅ Permitir se for dono, admin OU supervisor
        if (!postagem.getAutor().getEmail().equals(username) && !isAdmin && !isSupervisor) {
            throw new SecurityException("Você não pode excluir esta postagem.");
        }

        if (postagem.getArquivos() != null && !postagem.getArquivos().isEmpty()) {
            for (ArquivoMidia midia : new ArrayList<>(postagem.getArquivos())) {
                try {
                    midiaService.deletar(midia.getUrl());
                } catch (Exception e) {
                    System.err.println("AVISO: Falha ao deletar arquivo no Cloudinary: " + midia.getUrl());
                }
            }
        }

        postagemRepository.deleteById(id);
    }

    public List<PostagemSaidaDTO> buscarPostagensPublicas() {
        List<Postagem> posts = postagemRepository.findTop50ByOrderByDataPostagemDesc();
        return posts.stream()
                .map(this::toDTO) // Perfeito, já usa seu toDTO
                .collect(Collectors.toList());
    }

    public Postagem buscarPorId(Long id) {
        return postagemRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Postagem não encontrada"));
    }

    public PostagemSaidaDTO ordenarComentarios(PostagemSaidaDTO postagem) {
        if (postagem.getComentarios() != null && !postagem.getComentarios().isEmpty()) {
            List<ComentarioSaidaDTO> comentariosOrdenados = postagem.getComentarios().stream()
                    .sorted((a, b) -> {
                        if (a.isDestacado() != b.isDestacado()) {
                            return Boolean.compare(b.isDestacado(), a.isDestacado());
                        }
                        return a.getDataCriacao().compareTo(b.getDataCriacao());
                    })
                    .collect(Collectors.toList());

            postagem.setComentarios(comentariosOrdenados);
        }
        return postagem;
    }

    public PostagemSaidaDTO buscarPostagemPorIdComComentarios(Long id) {
        Postagem postagem = postagemRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Postagem não encontrada com o ID: " + id));
        return toDTO(postagem); // Perfeito
    }

    public List<PostagemSaidaDTO> buscarPostagensPorUsuario(Long usuarioId) {
        // 1. Busca as postagens pelo ID do autor (do repositório)
        List<Postagem> posts = postagemRepository.findByAutorIdOrderByDataPostagemDesc(usuarioId);

        // 2. Converte a lista de Postagem para PostagemSaidaDTO
        //    usando o SEU método 'toDTO' que já faz todo o trabalho
        //    de calcular curtidas e formatar URLs de fotos.
        return posts.stream()
                .map(this::toDTO)  // <--- Certifique-se que está 'toDTO'
                .collect(Collectors.toList());
    }
    private PostagemSaidaDTO toDTO(Postagem postagem) {
        List<String> urls = postagem.getArquivos() != null
                ? postagem.getArquivos().stream().map(ArquivoMidia::getUrl).collect(Collectors.toList())
                : Collections.emptyList();

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        final Long usuarioLogadoId = usuarioRepository.findByEmail(username)
                .map(Usuario::getId)
                .orElse(null);

        List<ComentarioSaidaDTO> comentariosDTO = postagem.getComentarios() != null
                ? postagem.getComentarios().stream().map(comentario -> {

            int totalCurtidasComentario = comentario.getCurtidas() != null ? comentario.getCurtidas().size() : 0;

            boolean curtidoPeloUsuarioComentario = false;
            if (usuarioLogadoId != null && comentario.getCurtidas() != null) {
                curtidoPeloUsuarioComentario = comentario.getCurtidas().stream()
                        .anyMatch(curtida -> curtida.getUsuario().getId().equals(usuarioLogadoId));
            }

            String nomeFotoComentario = comentario.getAutor().getFotoPerfil();
            String urlFotoComentarioCorrigida;
            if (nomeFotoComentario != null && !nomeFotoComentario.isBlank()) {
                if (nomeFotoComentario.startsWith("http")) {
                    urlFotoComentarioCorrigida = nomeFotoComentario;
                } else {
                    urlFotoComentarioCorrigida = "/api/arquivos/" + nomeFotoComentario;
                }
            } else {
                urlFotoComentarioCorrigida = "/images/default-avatar.jpg";
            }

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
                    .urlFotoAutor(urlFotoComentarioCorrigida)
                    .build();

        }).collect(Collectors.toList())
                : Collections.emptyList();

        int totalCurtidasPostagem = postagem.getCurtidas() != null ? postagem.getCurtidas().size() : 0;
        boolean curtidoPeloUsuarioPostagem = false;
        if (usuarioLogadoId != null && postagem.getCurtidas() != null) {
            curtidoPeloUsuarioPostagem = postagem.getCurtidas().stream()
                    .anyMatch(c -> c.getUsuario().getId().equals(usuarioLogadoId));
        }

        String nomeFotoAutor = postagem.getAutor().getFotoPerfil();
        String urlFotoAutorCorrigida;
        if (nomeFotoAutor != null && !nomeFotoAutor.isBlank()) {
            if (nomeFotoAutor.startsWith("http")) {
                urlFotoAutorCorrigida = nomeFotoAutor;
            } else {
                urlFotoAutorCorrigida = "/api/arquivos/" + nomeFotoAutor;
            }
        } else {
            urlFotoAutorCorrigida = "/images/default-avatar.jpg";
        }

        return PostagemSaidaDTO.builder()
                .id(postagem.getId())
                .conteudo(postagem.getConteudo())
                .dataCriacao(postagem.getDataPostagem()) // Nota: aqui você usa dataPostagem
                .autorId(postagem.getAutor().getId())
                .nomeAutor(postagem.getAutor().getNome())
                .urlsMidia(urls)
                .comentarios(comentariosDTO)
                .totalCurtidas(totalCurtidasPostagem)
                .urlFotoAutor(urlFotoAutorCorrigida)
                .curtidoPeloUsuario(curtidoPeloUsuarioPostagem)
                .tipo("atualizacao") // ✅ ÚNICA LINHA ADICIONADA
                .build();
    }

    private Postagem toEntity(PostagemEntradaDTO dto, Usuario autor) {
        return Postagem.builder()
                .conteudo(dto.getConteudo())
                .dataPostagem(LocalDateTime.now())
                .autor(autor)
                .build();
    }

    public PostagemSaidaDTO converteParaSaidaDTO(Postagem postagem) {
        if (postagem == null) {
            return null;
        }

        String nomeAutor = null;
        Long autorId = null;
        String urlFotoAutor = null;
        if (postagem.getAutor() != null) {
            nomeAutor = postagem.getAutor().getNome();
            autorId = postagem.getAutor().getId();
            urlFotoAutor = postagem.getAutor().getFotoPerfil();
        }

        List<String> urlsMidia = postagem.getArquivos().stream()
                .map(ArquivoMidia::getUrl)
                .collect(Collectors.toList());

        List<ComentarioSaidaDTO> comentariosDTO = postagem.getComentarios().stream()
                .map(this::converteComentarioParaDTO)
                .collect(Collectors.toList());

        return PostagemSaidaDTO.builder()
                .id(postagem.getId())
                .conteudo(postagem.getConteudo())
                // ✅ CORREÇÃO AQUI: O DTO usa 'dataCriacao', não 'dataPostagem'
                .dataCriacao(postagem.getDataPostagem())
                .autorId(autorId)
                .nomeAutor(nomeAutor)
                .urlFotoAutor(urlFotoAutor)
                .urlsMidia(urlsMidia)
                .comentarios(comentariosDTO)
                .totalCurtidas(postagem.getCurtidas() != null ? postagem.getCurtidas().size() : 0)
                .build();
    }

    // =========================================================================
// ✅ MÉTODO 2: AJUDANTE PARA CONVERTER COMENTÁRIO (CORRIGIDO)
// =========================================================================
    private ComentarioSaidaDTO converteComentarioParaDTO(Comentario comentario) {
        if (comentario == null) {
            return null;
        }

        UsuarioSimplesDTO autorComentarioDTO = converteUsuarioParaSimplesDTO(comentario.getAutor());

        // Também vamos popular o ID da postagem
        Long postagemId = null;
        if(comentario.getPostagem() != null) {
            postagemId = comentario.getPostagem().getId();
        }

        return ComentarioSaidaDTO.builder()
                .id(comentario.getId())
                .conteudo(comentario.getConteudo())
                .dataCriacao(comentario.getDataCriacao())
                // ✅ CORREÇÃO AQUI: Passando os campos separados
                .autorId(autorComentarioDTO.getId())
                .nomeAutor(autorComentarioDTO.getNome())
                .urlFotoAutor(autorComentarioDTO.getUrlFotoPerfil())
                .postagemId(postagemId) //
                .totalCurtidas(comentario.getCurtidas() != null ? comentario.getCurtidas().size() : 0)
                .build();
    }

    // =========================================================================
// ✅ MÉTODO 3: AJUDANTE PARA CONVERTER USUÁRIO (Revisado)
// =========================================================================
    private UsuarioSimplesDTO converteUsuarioParaSimplesDTO(Usuario usuario) {
        if (usuario == null) {
            return null;
        }

        return UsuarioSimplesDTO.builder()
                .id(usuario.getId())
                .nome(usuario.getNome())
                .urlFotoPerfil(usuario.getFotoPerfil())
                .tipoUsuario(usuario.getTipoUsuario())
                .build();
    }

}