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
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;

@Service
public class CurtidaService {
    @Autowired
    private CurtidaRepository curtidaRepository;
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private PostagemRepository postagemRepository;
    @Autowired private ComentarioRepository comentarioRepository;
    @Autowired private SimpMessagingTemplate messagingTemplate;

    @Transactional
    public void toggleCurtida(String username, Long postagemId, Long comentarioId) {
        Usuario usuario = usuarioRepository.findByEmail(username)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado"));

        Long postIdParaNotificar = null;

        if (postagemId != null) {
            // Lógica para curtir/descurtir postagem
            Optional<Curtida> curtidaExistente = curtidaRepository.findByUsuarioIdAndPostagemId(usuario.getId(), postagemId);

            if (curtidaExistente.isPresent()) {
                curtidaRepository.delete(curtidaExistente.get());
            } else {
                Postagem postagem = postagemRepository.findById(postagemId)
                        .orElseThrow(() -> new EntityNotFoundException("Postagem não encontrada"));
                Curtida novaCurtida = Curtida.builder().usuario(usuario).postagem(postagem).build();
                curtidaRepository.save(novaCurtida);
            }
            postIdParaNotificar = postagemId;

        } else if (comentarioId != null) {
            // Lógica para curtir/descurtir comentário
            Optional<Curtida> curtidaExistente = curtidaRepository.findByUsuarioIdAndComentarioId(usuario.getId(), comentarioId);
            Comentario comentario = comentarioRepository.findById(comentarioId)
                    .orElseThrow(() -> new EntityNotFoundException("Comentário não encontrado"));

            if (curtidaExistente.isPresent()) {
                curtidaRepository.delete(curtidaExistente.get());
            } else {
                Curtida novaCurtida = Curtida.builder().usuario(usuario).comentario(comentario).build();
                curtidaRepository.save(novaCurtida);
            }
            postIdParaNotificar = comentario.getPostagem().getId();
        }

        // Notifica o frontend que algo mudou na postagem
        if (postIdParaNotificar != null) {
            messagingTemplate.convertAndSend("/topic/postagem/" + postIdParaNotificar + "/comentarios",
                    Map.of("tipo", "atualizacao_curtida", "postagemId", postIdParaNotificar));
        }
    }
}
