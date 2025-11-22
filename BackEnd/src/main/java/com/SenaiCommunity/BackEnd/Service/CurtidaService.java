package com.SenaiCommunity.BackEnd.Service;

import com.SenaiCommunity.BackEnd.Entity.Comentario;
import com.SenaiCommunity.BackEnd.Entity.Curtida;
import com.SenaiCommunity.BackEnd.Entity.Postagem;
import com.SenaiCommunity.BackEnd.Entity.Usuario;
import com.SenaiCommunity.BackEnd.Repository.ComentarioRepository;
import com.SenaiCommunity.BackEnd.Repository.CurtidaRepository;
import com.SenaiCommunity.BackEnd.Repository.PostagemRepository;
import com.SenaiCommunity.BackEnd.Repository.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class CurtidaService {

    @Autowired
    private CurtidaRepository curtidaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PostagemRepository postagemRepository;

    @Autowired
    private ComentarioRepository comentarioRepository;

    @Autowired
    private NotificacaoService notificacaoService;

    @Transactional
    public Long toggleCurtida(String username, Long postagemId, Long comentarioId) {
        Usuario usuario = usuarioRepository.findByEmail(username)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado"));

        if (comentarioId != null) {
            // Lógica para curtir/descurtir comentário
            Optional<Curtida> curtidaExistente = curtidaRepository.findByUsuarioIdAndComentarioId(usuario.getId(), comentarioId);

            Comentario comentario = comentarioRepository.findById(comentarioId)
                    .orElseThrow(() -> new EntityNotFoundException("Comentário não encontrado"));

            if (curtidaExistente.isPresent()) {
                curtidaRepository.delete(curtidaExistente.get());
            } else {
                Curtida novaCurtida = new Curtida();
                novaCurtida.setUsuario(usuario);
                novaCurtida.setComentario(comentario);
                curtidaRepository.save(novaCurtida);

                if (!comentario.getAutor().getId().equals(usuario.getId())) {
                    // --- MUDANÇA AQUI ---
                    // Passa o 'usuario' (remetente), o tipo e o ID da postagem
                    notificacaoService.criarNotificacao(
                            comentario.getAutor(),
                            usuario, // <-- O remetente que fez a ação
                            usuario.getNome() + " curtiu seu comentário.",
                            "CURTIDA_COMENTARIO", // <-- Tipo específico
                            comentario.getPostagem().getId() // <-- ID de referência
                    );
                    // --- FIM DA MUDANÇA ---
                }
            }
            return comentario.getPostagem().getId(); // Retorna o ID da postagem pai para notificação

        } else if (postagemId != null) {
            // Lógica para curtir/descurtir postagem
            Optional<Curtida> curtidaExistente = curtidaRepository.findByUsuarioIdAndPostagemId(usuario.getId(), postagemId);

            if (curtidaExistente.isPresent()) {
                curtidaRepository.delete(curtidaExistente.get());
            } else {
                Postagem postagem = postagemRepository.findById(postagemId)
                        .orElseThrow(() -> new EntityNotFoundException("Postagem não encontrada"));
                Curtida novaCurtida = new Curtida();
                novaCurtida.setUsuario(usuario);
                novaCurtida.setPostagem(postagem);
                curtidaRepository.save(novaCurtida);

                // NOTIFICAR o autor da postagem (se não for ele mesmo)
                if (!postagem.getAutor().getId().equals(usuario.getId())) {
                    // --- MUDANÇA AQUI ---
                    // Passa o 'usuario' (remetente), o tipo e o ID da postagem
                    notificacaoService.criarNotificacao(
                            postagem.getAutor(),
                            usuario, // <-- O remetente que fez a ação
                            usuario.getNome() + " curtiu sua postagem.",
                            "CURTIDA_POSTAGEM", // <-- Tipo específico
                            postagemId // <-- ID de referência
                    );
                    // --- FIM DA MUDANÇA ---
                }
            }
            return postagemId;

        } else {
            throw new IllegalArgumentException("É necessário fornecer postagemId ou comentarioId.");
        }
    }
}