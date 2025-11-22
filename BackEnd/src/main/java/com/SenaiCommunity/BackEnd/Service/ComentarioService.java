package com.SenaiCommunity.BackEnd.Service;

import com.SenaiCommunity.BackEnd.DTO.ComentarioEntradaDTO;
import com.SenaiCommunity.BackEnd.DTO.ComentarioSaidaDTO;
import com.SenaiCommunity.BackEnd.DTO.PostagemSaidaDTO; // ✅ IMPORTAR
import com.SenaiCommunity.BackEnd.Entity.Comentario;
import com.SenaiCommunity.BackEnd.Entity.Postagem;
import com.SenaiCommunity.BackEnd.Entity.Usuario;
import com.SenaiCommunity.BackEnd.Repository.ComentarioRepository;
import com.SenaiCommunity.BackEnd.Repository.PostagemRepository;
import com.SenaiCommunity.BackEnd.Repository.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; // ✅ IMPORTAR

import java.time.LocalDateTime;
import java.util.NoSuchElementException;

@Service
public class ComentarioService {

    @Autowired
    private ComentarioRepository comentarioRepository;

    @Autowired
    private PostagemRepository postagemRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PostagemService postagemService; // ✅ INJETAR O SERVICE DE POSTAGEM

    @Transactional
    // ✅ MODIFICADO: Agora retorna o Post completo
    public PostagemSaidaDTO criarComentario(Long postagemId, String autorUsername, ComentarioEntradaDTO comentarioDTO) {
        Usuario autor = usuarioRepository.findByEmail(autorUsername)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado"));

        Postagem postagem = postagemRepository.findById(postagemId)
                .orElseThrow(() -> new EntityNotFoundException("Postagem não encontrada"));

        Comentario parent = null;
        if (comentarioDTO.getParentId() != null) {
            parent = comentarioRepository.findById(comentarioDTO.getParentId())
                    .orElseThrow(() -> new NoSuchElementException("Comentário pai não encontrado"));
        }

        Comentario comentario = Comentario.builder()
                .conteudo(comentarioDTO.getConteudo())
                .dataCriacao(LocalDateTime.now())
                .autor(autor)
                .postagem(postagem)
                .parent(parent)
                .destacado(false)
                .build();

        comentarioRepository.save(comentario);

        // ✅ MODIFICADO: Em vez de retornar o DTO do comentário,
        // busca o post ATUALIZADO (com o novo comentário) dentro da mesma transação.
        return postagemService.buscarPostagemPorIdComComentarios(postagemId);
    }

    @Transactional
    // ✅ MODIFICADO: Agora retorna o Post completo
    public PostagemSaidaDTO editarComentario(Long id, String username, String novoConteudo) {
        Comentario comentario = comentarioRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Comentário não encontrado"));

        if (!comentario.getAutor().getEmail().equals(username)) {
            throw new SecurityException("Você não tem permissão para editar este comentário.");
        }

        comentario.setConteudo(novoConteudo);
        comentarioRepository.save(comentario);
        // ✅ MODIFICADO: Retorna o post atualizado
        return postagemService.buscarPostagemPorIdComComentarios(comentario.getPostagem().getId());
    }

    @Transactional
    // ✅ MODIFICADO: Agora retorna o Post completo
    public PostagemSaidaDTO destacarComentario(Long id, String username) {
        Comentario comentario = comentarioRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Comentário não encontrado"));

        Postagem postagem = comentario.getPostagem();
        if (!postagem.getAutor().getEmail().equals(username)) {
            throw new SecurityException("Apenas o autor da postagem pode destacar comentários.");
        }

        // Desmarca todos os outros comentários
        postagem.getComentarios().forEach(c -> c.setDestacado(false));

        // Marca o comentário atual
        comentario.setDestacado(true);
        comentarioRepository.save(comentario);
        // ✅ MODIFICADO: Retorna o post atualizado
        return postagemService.buscarPostagemPorIdComComentarios(postagem.getId());
    }

    @Transactional
    // ✅ MODIFICADO: Agora retorna o Post completo
    public PostagemSaidaDTO excluirComentario(Long id, String username) {
        Comentario comentario = comentarioRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Comentário não encontrado"));

        if (!comentario.getAutor().getEmail().equals(username)) {
            throw new SecurityException("Você não tem permissão para excluir este comentário.");
        }

        // Pega o ID do post ANTES de deletar o comentário
        Long postagemId = comentario.getPostagem().getId();

        comentarioRepository.delete(comentario);

        // ✅ MODIFICADO: Retorna o post atualizado (sem o comentário)
        return postagemService.buscarPostagemPorIdComComentarios(postagemId);
    }

    /**
     * ✅ MÉTODO ADICIONADO:
     * Este método 'toDTO' estava faltando no seu arquivo.
     * Ele é baseado no 'toDTO' de comentários que está no seu PostagemService.
     */
    private ComentarioSaidaDTO toDTO(Comentario comentario) {
        // Lógica para obter o ID do usuário logado
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        final Long usuarioLogadoId = usuarioRepository.findByEmail(username)
                .map(Usuario::getId)
                .orElse(null);

        // 1. Calcular o total de curtidas
        int totalCurtidasComentario = comentario.getCurtidas() != null ? comentario.getCurtidas().size() : 0;

        // 2. Verificar se o usuário logado curtiu
        boolean curtidoPeloUsuarioComentario = false;
        if (usuarioLogadoId != null && comentario.getCurtidas() != null) {
            curtidoPeloUsuarioComentario = comentario.getCurtidas().stream()
                    .anyMatch(curtida -> curtida.getUsuario().getId().equals(usuarioLogadoId));
        }

        // 3. Corrigir a URL da foto do autor (lógica do seu PostagemService)
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

        // 4. Construir o DTO
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
    }
}