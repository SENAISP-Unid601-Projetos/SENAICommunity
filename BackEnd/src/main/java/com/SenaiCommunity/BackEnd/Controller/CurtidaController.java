package com.SenaiCommunity.BackEnd.Controller;

import com.SenaiCommunity.BackEnd.DTO.CurtidaEntradaDTO;
import com.SenaiCommunity.BackEnd.DTO.PostagemSaidaDTO; // ✅ IMPORT ADICIONADO
// import com.SenaiCommunity.BackEnd.Entity.Usuario; // Não é mais necessário aqui
import com.SenaiCommunity.BackEnd.Service.CurtidaService;
import com.SenaiCommunity.BackEnd.Service.PostagemService; // ✅ IMPORT ADICIONADO
// import com.SenaiCommunity.BackEnd.Service.UsuarioService; // Não é mais necessário aqui
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
// import java.util.Map; // Não é mais necessário

@RestController
@RequestMapping("/curtidas")
@PreAuthorize("hasRole('ALUNO') or hasRole('PROFESSOR')")
public class CurtidaController {

    @Autowired
    private CurtidaService curtidaService;

    // @Autowired
    // private UsuarioService usuarioService; // Removido, PostagemService cuidará disso

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private PostagemService postagemService; // ✅ SERVICE DE POSTAGEM INJETADO

    @PostMapping("/toggle")
    public ResponseEntity<?> toggleCurtida(@RequestBody CurtidaEntradaDTO dto, Principal principal) {
        try {
            // =======================================================
            // ✅ LÓGICA DE CURTIDA ATUALIZADA (O CORAÇÃO DA CORREÇÃO) ✅
            // =======================================================

            // 1. Sua lógica de curtir/descurtir (isso já funcionava)
            Long postagemIdParaNotificar = curtidaService.toggleCurtida(principal.getName(), dto.getPostagemId(), dto.getComentarioId());

            // 2. Buscar o DTO da postagem ATUALIZADA
            //    O seu 'PostagemService' já sabe como calcular 'curtidoPeloUsuario'
            //    e 'totalCurtidas' através do método toDTO (que é chamado por este).
            PostagemSaidaDTO postAtualizado = postagemService.buscarPostagemPorIdComComentarios(postagemIdParaNotificar);

            // 3. Enviar o DTO COMPLETO para o WebSocket
            //    Em vez de um Map incompleto, enviamos o objeto completo.
            //    O frontend agora receberá TODOS os dados e não vai "quebrar" o post.
            messagingTemplate.convertAndSend("/topic/publico", postAtualizado);

            return ResponseEntity.ok().build();

        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }
}