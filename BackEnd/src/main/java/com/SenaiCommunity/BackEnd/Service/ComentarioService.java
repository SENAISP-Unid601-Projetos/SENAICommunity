package com.SenaiCommunity.BackEnd.Service;

import com.SenaiCommunity.BackEnd.DTO.ComentarioEntradaDTO;
import com.SenaiCommunity.BackEnd.DTO.ComentarioSaidaDTO;
import com.SenaiCommunity.BackEnd.Entity.Comentario;
import com.SenaiCommunity.BackEnd.Entity.Postagem;
import com.SenaiCommunity.BackEnd.Entity.Usuario;
import com.SenaiCommunity.BackEnd.Exception.ConteudoImproprioException;
import com.SenaiCommunity.BackEnd.Repository.ComentarioRepository;
import com.SenaiCommunity.BackEnd.Repository.PostagemRepository;
import com.SenaiCommunity.BackEnd.Repository.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
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

    @Autowired
    private NotificacaoService notificacaoService;

    @Autowired
    private FiltroProfanidadeService filtroProfanidade;

    /**
     * Cria um novo comentário, associa ao autor e à postagem, e o salva no banco.
     */
    @Transactional
    public ComentarioSaidaDTO criarComentario(Long postagemId, String autorUsername, ComentarioEntradaDTO dto) {
        Usuario autor = usuarioRepository.findByEmail(autorUsername)
                .orElseThrow(() -> new NoSuchElementException("Usuário não encontrado"));
        Postagem postagem = postagemRepository.findById(postagemId)
                .orElseThrow(() -> new EntityNotFoundException("Postagem não encontrada"));

        // 1. Checa o conteúdo ANTES de criar o objeto
        if (filtroProfanidade.contemProfanidade(dto.getConteudo())) {
            throw new ConteudoImproprioException("Seu comentário contém texto não permitido.");
        }

        Comentario novoComentario = Comentario.builder()
                .conteudo(dto.getConteudo())
                .dataCriacao(LocalDateTime.now()) // Definindo a data de criação
                .autor(autor)
                .postagem(postagem)
                .build();

        Comentario parent = null; // Variável para guardar o comentário pai

        // 2. Se for uma resposta, associa ao comentário pai
        if (dto.getParentId() != null) {
            parent = comentarioRepository.findById(dto.getParentId())
                    .orElseThrow(() -> new EntityNotFoundException("Comentário pai não encontrado"));
            novoComentario.setParent(parent);
        }

        // 3. ▼▼▼ CORREÇÃO: Salva o comentário ANTES de notificar ▼▼▼
        Comentario comentarioSalvo = comentarioRepository.save(novoComentario);

        // 4. Envia notificações (Agora 'comentarioSalvo.getId()' funciona)
        if (parent != null) {
            // Notifica o autor do comentário PAI (se não for ele mesmo)
            if (!parent.getAutor().getId().equals(autor.getId())) {
                notificacaoService.criarNotificacao(
                        parent.getAutor(),
                        autor.getNome() + " respondeu ao seu comentário.",
                        "NOVO_COMENTARIO",
                        postagem.getId(), // PostID
                        comentarioSalvo.getId() // O ID do novo comentário
                );
            }
        } else {
            // Se não for uma resposta, notifica o autor da POSTAGEM (se não for ele mesmo)
            if (!postagem.getAutor().getId().equals(autor.getId())) {
                notificacaoService.criarNotificacao(
                        postagem.getAutor(),
                        autor.getNome() + " comentou na sua postagem.",
                        "NOVO_COMENTARIO",
                        postagem.getId(), // PostID
                        comentarioSalvo.getId() // O ID do novo comentário
                );
            }
        }
        // ▲▲▲ FIM DA CORREÇÃO ▲▲▲

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

        // ▼▼▼ CORREÇÃO: Verificar o 'novoConteudo', não o conteúdo antigo ▼▼▼
        if (filtroProfanidade.contemProfanidade(novoConteudo)) {
            throw new ConteudoImproprioException("Seu comentário contém texto não permitido.");
        }
        // ▲▲▲ FIM DA CORREÇÃO ▲▲▲

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
                .orElseThrow(() -> new EntityNotFoundException("Comentário não encontrado"));

        String autorComentarioEmail = comentario.getAutor().getEmail();
        String autorPostagemEmail = comentario.getPostagem().getAutor().getEmail();

        // Regra de segurança: Permite a exclusão se o usuário for o autor do comentário OU o autor da postagem.
        if (!autorComentarioEmail.equals(username) && !autorPostagemEmail.equals(username)) {
            throw new SecurityException("Acesso negado: Você não tem permissão para excluir este comentário.");
        }

        // Primeiro criamos o DTO de retorno, pois após a exclusão perderemos os dados.
        ComentarioSaidaDTO dtoDeRetorno = toDTO(comentario);
        comentarioRepository.delete(comentario);

        return dtoDeRetorno;
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

        // --- INÍCIO DA LÓGICA DE CÁLCULO DAS CURTIDAS (CORREÇÃO) ---

        // 1. Obter o ID do usuário logado (se houver)
        Long usuarioLogadoId = null;
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        // Evita erro caso a requisição seja anônima (pouco provável com PreAuthorize, mas é uma boa prática)
        if (!"anonymousUser".equals(username)) {
            Usuario usuarioLogado = usuarioRepository.findByEmail(username).orElse(null);
            if (usuarioLogado != null) {
                usuarioLogadoId = usuarioLogado.getId();
            }
        }

        // 2. Calcular o total de curtidas
        int totalCurtidasComentario = comentario.getCurtidas() != null ? comentario.getCurtidas().size() : 0;

        // 3. Verificar se o usuário logado curtiu este comentário
        boolean curtidoPeloUsuarioComentario = false;
        if (usuarioLogadoId != null && comentario.getCurtidas() != null) {
            final Long finalUsuarioLogadoId = usuarioLogadoId; // Variável precisa ser final ou efetivamente final para usar no lambda
            curtidoPeloUsuarioComentario = comentario.getCurtidas().stream()
                    .anyMatch(curtida -> curtida.getUsuario().getId().equals(finalUsuarioLogadoId));
        }

        // --- FIM DA LÓGICA DE CÁLCULO DAS CURTIDAS ---

        return ComentarioSaidaDTO.builder()
                .id(comentario.getId())
                .conteudo(comentario.getConteudo())
                .dataCriacao(comentario.getDataCriacao())
                .autorId(comentario.getAutor().getId())
                .urlFotoAutor(comentario.getAutor().getFotoPerfil())
                .nomeAutor(comentario.getAutor().getNome())
                .postagemId(comentario.getPostagem().getId())
                .parentId(comentario.getParent() != null ? comentario.getParent().getId() : null)
                .replyingToName(comentario.getParent() != null ? comentario.getParent().getAutor().getNome() : null)
                .destacado(comentario.isDestacado())
                .totalCurtidas(totalCurtidasComentario)
                .curtidoPeloUsuario(curtidoPeloUsuarioComentario)
                .build();
    }
}