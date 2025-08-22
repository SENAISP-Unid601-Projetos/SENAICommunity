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
import java.util.NoSuchElementException;

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
                .orElseThrow(() -> new NoSuchElementException("Usuário autor do comentário não encontrado"));

        Postagem postagem = postagemRepository.findById(postagemId)
                .orElseThrow(() -> new EntityNotFoundException("Postagem com ID " + postagemId + " não encontrada"));

        Comentario novoComentario = Comentario.builder()
                .conteudo(dto.getConteudo())
                .dataCriacao(LocalDateTime.now())
                .autor(autor)
                .postagem(postagem)
                .build();

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

    /**
     * Converte uma entidade Comentario para um ComentarioSaidaDTO.
     */
    private ComentarioSaidaDTO toDTO(Comentario comentario) {
        return ComentarioSaidaDTO.builder()
                .id(comentario.getId())
                .conteudo(comentario.getConteudo())
                .dataCriacao(comentario.getDataCriacao())
                .autorId(comentario.getAutor().getId())
                .nomeAutor(comentario.getAutor().getNome())
                .postagemId(comentario.getPostagem().getId())
                .build();
    }
}
