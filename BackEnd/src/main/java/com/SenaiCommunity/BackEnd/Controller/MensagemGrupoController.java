package com.SenaiCommunity.BackEnd.Controller;

import com.SenaiCommunity.BackEnd.DTO.MensagemGrupoEntradaDTO;
import com.SenaiCommunity.BackEnd.DTO.MensagemGrupoSaidaDTO;
import com.SenaiCommunity.BackEnd.Service.MensagemGrupoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageExceptionHandler;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Controller
public class MensagemGrupoController {

    @Autowired
    private MensagemGrupoService mensagemGrupoService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/grupo/{grupoId}")
    public void enviarMensagemParaGrupo(
            @DestinationVariable Long grupoId,
            @Payload MensagemGrupoEntradaDTO dto,
            Principal principal) {
        try {
            // O serviço já envia para o tópico /topic/grupo/{grupoId}
            mensagemGrupoService.enviarMensagem(grupoId, dto, principal.getName());
        } catch (Exception e) {
            enviarErroParaUsuario(principal.getName(), "Erro ao enviar mensagem: " + e.getMessage());
        }
    }

    @MessageMapping("/grupo/{mensagemId}/editar")
    public void editarMensagem(
            @DestinationVariable Long mensagemId,
            Principal principal,
            @Payload String novoConteudo) { // <-- O @Payload AQUI ESTÁ CORRETO
        try {
            // O serviço já envia a mensagem atualizada para o tópico
            mensagemGrupoService.editarMensagem(mensagemId, novoConteudo, principal.getName());
        } catch (Exception e) {
            enviarErroParaUsuario(principal.getName(), "Erro ao editar mensagem: " + e.getMessage());
        }
    }

    // ✅✅✅ CORREÇÃO AQUI ✅✅✅
    @MessageMapping("/grupo/{mensagemId}/excluir")
    public void excluirMensagem(
            @DestinationVariable Long mensagemId,
            Principal principal
            /* @Payload String novoConteudo REMOVIDO */ ) { // <-- O @Payload foi removido daqui
        try {
            // O serviço já envia a notificação de exclusão para o tópico
            mensagemGrupoService.excluirMensagem(mensagemId, principal.getName());
        } catch (Exception e) {
            enviarErroParaUsuario(principal.getName(), "Erro ao excluir mensagem: " + e.getMessage());
        }
    }
    // ✅✅✅ FIM DA CORREÇÃO ✅✅✅


    @MessageExceptionHandler
    @SendToUser("/queue/errors")
    public String handleException(Throwable exception) {
        // Envia uma mensagem de erro genérica de volta para o usuário
        return "Erro no processamento da mensagem do grupo: " + exception.getMessage();
    }

    // Método utilitário para enviar erros específicos para o usuário
    private void enviarErroParaUsuario(String username, String errorMessage) {
        if (username != null && !username.isBlank()) {
            messagingTemplate.convertAndSendToUser(username, "/queue/errors", errorMessage);
        }
    }
}