package com.SenaiCommunity.BackEnd.Controller;

import com.SenaiCommunity.BackEnd.DTO.MensagemProjetoEdicaoDTO;
import com.SenaiCommunity.BackEnd.DTO.MensagemProjetoSaidaDTO;
import com.SenaiCommunity.BackEnd.Service.MensagemProjetoService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/projetos/{projetoId}/chat")
@PreAuthorize("hasRole('ALUNO') or hasRole('PROFESSOR')")
public class MensagemProjetoController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private MensagemProjetoService mensagemProjetoService;

    @PostMapping("/mensagens")
    public ResponseEntity<MensagemProjetoSaidaDTO> enviarMensagem(
            @PathVariable Long projetoId,
            @RequestPart("conteudo") String conteudo, // Usamos RequestPart para dados e arquivos
            @RequestPart(value = "arquivos", required = false) List<MultipartFile> arquivos,
            Principal principal) {

        MensagemProjetoSaidaDTO mensagemSalva = mensagemProjetoService.salvarMensagem(principal.getName(), projetoId, conteudo, arquivos);
        messagingTemplate.convertAndSend("/topic/projeto/" + projetoId, mensagemSalva);

        return ResponseEntity.ok(mensagemSalva);
    }

    @GetMapping("/mensagens")
    public ResponseEntity<List<MensagemProjetoSaidaDTO>> getMensagensDoProjeto(@PathVariable Long projetoId) {
        List<MensagemProjetoSaidaDTO> mensagens = mensagemProjetoService.buscarMensagensPorProjeto(projetoId);
        return ResponseEntity.ok(mensagens);
    }

    @PutMapping(path = "/mensagens/{mensagemId}", consumes = "multipart/form-data")
    public ResponseEntity<?> editarMensagem(
            @PathVariable Long projetoId,
            @PathVariable Long mensagemId,
            // 2. RECEBA O DTO com a chave "dadosEdicao"
            @RequestPart("dadosEdicao") MensagemProjetoEdicaoDTO dadosEdicao,
            @RequestPart(value = "novosArquivos", required = false) List<MultipartFile> novosArquivos,
            Principal principal) {
        try {
            // 3. PASSE OS DADOS DO DTO PARA O SERVIÇO
            MensagemProjetoSaidaDTO mensagemAtualizada = mensagemProjetoService.editarMensagem(
                    mensagemId,
                    principal.getName(),
                    dadosEdicao.getConteudo(), // <-- Pega o conteúdo de dentro do DTO
                    novosArquivos,
                    dadosEdicao.getUrlsParaRemover() // <-- Pega as URLs de dentro do DTO
            );

            // Notifica via WebSocket que uma mensagem foi editada
            Map<String, Object> payload = Map.of("tipo", "edicao", "mensagem", mensagemAtualizada);
            messagingTemplate.convertAndSend("/topic/projeto/" + projetoId, payload);

            return ResponseEntity.ok(mensagemAtualizada);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            // Adicionado um catch-all para ver outros possíveis erros
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erro interno: " + e.getMessage());
        }
    }

    @DeleteMapping("/mensagens/{mensagemId}")
    public ResponseEntity<?> excluirMensagem(
            @PathVariable Long projetoId,
            @PathVariable Long mensagemId,
            Principal principal) {
        try {
            mensagemProjetoService.excluirMensagem(mensagemId, principal.getName());

            // Notifica via WebSocket que uma mensagem foi removida
            Map<String, Object> payload = Map.of("tipo", "remocao", "id", mensagemId);
            messagingTemplate.convertAndSend("/topic/projeto/" + projetoId, payload);

            return ResponseEntity.ok().build();
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }
}