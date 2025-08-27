package com.SenaiCommunity.BackEnd.Service;

import com.SenaiCommunity.BackEnd.DTO.ComentarioEntradaDTO;
import com.SenaiCommunity.BackEnd.DTO.ComentarioSaidaDTO;
import com.SenaiCommunity.BackEnd.Entity.Comentario;
import com.SenaiCommunity.BackEnd.Entity.Postagem;
import com.SenaiCommunity.BackEnd.Entity.Usuario;
import com.SenaiCommunity.BackEnd.Repository.ComentarioRepository;
import com.SenaiCommunity.BackEnd.Repository.PostagemRepository;
import com.SenaiCommunity.BackEnd.Repository.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Service
public class ComentarioService {

    @Autowired
    private ComentarioRepository comentarioRepository;

    @Autowired
    private PostagemRepository postagemRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    /**
     * Cria um novo comentário, associa ao autor e à postagem, e o salva no banco.
     */
    @Transactional
    public ComentarioSaidaDTO criarComentario(Long postagemId, String autorUsername, ComentarioEntradaDTO dto) {
        Usuario autor = usuarioRepository.findByEmail(autorUsername)
                .orElseThrow(() -> new NoSuchElementException("Usuário não encontrado"));
        Postagem postagem = postagemRepository.findById(postagemId)
                .orElseThrow(() -> new EntityNotFoundException("Postagem não encontrada"));

        Comentario novoComentario = Comentario.builder()
                .conteudo(dto.getConteudo())
                .autor(autor)
                .postagem(postagem)
                .build();

        // Se for uma resposta, associa ao comentário pai
        if (dto.getParentId() != null) {
            Comentario parent = comentarioRepository.findById(dto.getParentId())
                    .orElseThrow(() -> new EntityNotFoundException("Comentário pai não encontrado"));
            novoComentario.setParent(parent);
        }

        Comentario comentarioSalvo = comentarioRepository.save(novoComentario);
        return toDTO(comentarioSalvo);
    }

    /**
     * Edita o conteúdo de um comentário existente, verificando a permissão do autor.
     */
    @Transactional
    public ComentarioSaidaDTO editarComentario(Long comentarioId, String username, String novoConteudo) {
        Comentario comentario = comentarioRepository.findById(comentarioId)
                .orElseThrow(() -> new EntityNotFoundException("Comentário não encontrado"));

        // Regra de segurança: Apenas o autor do comentário pode editar.
        if (!comentario.getAutor().getEmail().equals(username)) {
            throw new SecurityException("Acesso negado: Você não é o autor deste comentário.");
        }

        comentario.setConteudo(novoConteudo);
        Comentario comentarioSalvo = comentarioRepository.save(comentario);
        return toDTO(comentarioSalvo);
    }

    /**
     * Exclui um comentário, verificando se o solicitante é o autor do comentário ou o autor da postagem.
     */
    @Transactional
    public ComentarioSaidaDTO excluirComentario(Long comentarioId, String username) {
        Comentario comentario = comentarioRepository.findById(comentarioId)
                .orElseThrow(() -> new EntityNotFoundException("Comentário не encontrado"));

        String autorComentarioEmail = comentario.getAutor().getEmail();
        String autorPostagemEmail = comentario.getPostagem().getAutor().getEmail();

        // Regra de segurança: Permite a exclusão se o usuário for o autor do comentário OU o autor da postagem.
        if (!autorComentarioEmail.equals(username) && !autorPostagemEmail.equals(username)) {
            throw new SecurityException("Acesso negado: Você não tem permissão para excluir este comentário.");
        }

        comentarioRepository.delete(comentario);

        // Retorna o DTO do comentário excluído para que o controller possa notificar o tópico correto.
        return toDTO(comentario);
    }


    @Transactional
    public ComentarioSaidaDTO destacarComentario(Long comentarioId, String username) {
        Comentario comentario = comentarioRepository.findById(comentarioId)
                .orElseThrow(() -> new EntityNotFoundException("Comentário não encontrado"));

        // Regra de segurança: Apenas o autor da postagem pode destacar
        if (!comentario.getPostagem().getAutor().getEmail().equals(username)) {
            throw new SecurityException("Acesso negado: Apenas o autor da postagem pode destacar comentários.");
        }

        // Alterna o estado de "destacado"
        comentario.setDestacado(!comentario.isDestacado());
        Comentario comentarioSalvo = comentarioRepository.save(comentario);
        return toDTO(comentarioSalvo);
    }


    private ComentarioSaidaDTO toDTO(Comentario comentario) {
        if (comentario == null) return null;

        List<ComentarioSaidaDTO> repliesDTO = comentario.getReplies() != null ?
                comentario.getReplies().stream().map(this::toDTO).collect(Collectors.toList()) :
                Collections.emptyList();

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
                .build();
    }
}
