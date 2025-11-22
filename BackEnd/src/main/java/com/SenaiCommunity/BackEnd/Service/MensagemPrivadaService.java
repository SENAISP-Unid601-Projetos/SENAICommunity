package com.SenaiCommunity.BackEnd.Service;

import com.SenaiCommunity.BackEnd.DTO.MensagemPrivadaEntradaDTO;
import com.SenaiCommunity.BackEnd.DTO.MensagemPrivadaSaidaDTO;
import com.SenaiCommunity.BackEnd.Entity.MensagemPrivada;
import com.SenaiCommunity.BackEnd.Entity.Usuario;
import com.SenaiCommunity.BackEnd.Repository.MensagemPrivadaRepository;
import com.SenaiCommunity.BackEnd.Repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class MensagemPrivadaService {

    @Autowired
    private MensagemPrivadaRepository mensagemPrivadaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private NotificacaoService notificacaoService;

    private MensagemPrivadaSaidaDTO toDTO(MensagemPrivada mensagem) {
        return MensagemPrivadaSaidaDTO.builder()
                .id(mensagem.getId())
                .conteudo(mensagem.getConteudo())
                .dataEnvio(mensagem.getDataEnvio())
                .remetenteId(mensagem.getRemetente().getId())
                .nomeRemetente(mensagem.getRemetente().getNome())
                .remetenteEmail(mensagem.getRemetente().getEmail())
                .destinatarioId(mensagem.getDestinatario().getId())
                .nomeDestinatario(mensagem.getDestinatario().getNome())
                .destinatarioEmail(mensagem.getDestinatario().getEmail())
                .dataEdicao(mensagem.getDataEdicao())
                .build();
    }

    private MensagemPrivada toEntity(MensagemPrivadaEntradaDTO dto, Usuario remetente, Usuario destinatario) {
        return MensagemPrivada.builder()
                .conteudo(dto.getConteudo())
                .dataEnvio(LocalDateTime.now())
                .remetente(remetente)
                .destinatario(destinatario)
                .build();
    }

    @Transactional
    public MensagemPrivadaSaidaDTO salvarMensagemPrivada(MensagemPrivadaEntradaDTO dto, String remetenteUsername) {
        Usuario remetente = usuarioRepository.findByEmail(remetenteUsername)
                .orElseThrow(() -> new NoSuchElementException("Remetente não encontrado"));
        Usuario destinatario = usuarioRepository.findById(dto.getDestinatarioId())
                .orElseThrow(() -> new NoSuchElementException("Destinatário não encontrado"));

        MensagemPrivada novaMensagem = toEntity(dto, remetente, destinatario);
        MensagemPrivada mensagemSalva = mensagemPrivadaRepository.save(novaMensagem);

        // **********************************
        // 🚀 CORREÇÃO APLICADA AQUI
        // **********************************
        String conteudoMensagem = mensagemSalva.getConteudo(); // Pega o texto real

        notificacaoService.criarNotificacao(
                destinatario,       // Usuario destinatario
                remetente,          // Usuario remetente (ISSO CORRIGE A FOTO)
                conteudoMensagem,   // String mensagem (ISSO CORRIGE O TEXTO)
                "MENSAGEM_PRIVADA", // String tipo
                remetente.getId()   // Long idReferencia (ID do remetente, para o frontend agrupar)
        );
        // **********************************

        return toDTO(mensagemSalva);
    }

    // ✅ CORREÇÃO: Método de Edição
    @Transactional
    public MensagemPrivadaSaidaDTO editarMensagemPrivada(Long id, String novoConteudo, String autorUsername) {
        MensagemPrivada mensagem = mensagemPrivadaRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Mensagem não encontrada"));

        if (!mensagem.getRemetente().getEmail().equals(autorUsername)) {
            throw new SecurityException("Você não pode editar esta mensagem.");
        }

        mensagem.setConteudo(novoConteudo);
        mensagem.setDataEdicao(LocalDateTime.now()); // Define a data de edição
        MensagemPrivada mensagemSalva = mensagemPrivadaRepository.save(mensagem);
        return toDTO(mensagemSalva); // Retorna o DTO
    }

    // ✅ CORREÇÃO: Método de Exclusão
    @Transactional
    public MensagemPrivadaSaidaDTO excluirMensagemPrivada(Long id, String autorUsername) {
        MensagemPrivada mensagem = mensagemPrivadaRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Mensagem não encontrada"));

        if (!mensagem.getRemetente().getEmail().equals(autorUsername)) {
            throw new SecurityException("Você não pode excluir esta mensagem.");
        }

        mensagemPrivadaRepository.delete(mensagem);
        return toDTO(mensagem); // Retorna o DTO da mensagem excluída
    }

    public List<MensagemPrivadaSaidaDTO> buscarMensagensPrivadas(Long user1, Long user2) {
        List<MensagemPrivada> mensagens = mensagemPrivadaRepository.findMensagensEntreUsuarios(user1, user2);
        // Converte a lista de entidades para uma lista de DTOs antes de retornar
        return mensagens.stream()
                .map(this::toDTO) // Usa o método toDTO que você já criou
                .collect(Collectors.toList());
    }
}