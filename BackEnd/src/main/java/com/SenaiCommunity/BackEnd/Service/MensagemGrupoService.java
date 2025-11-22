package com.SenaiCommunity.BackEnd.Service;

import com.SenaiCommunity.BackEnd.DTO.MensagemGrupoEntradaDTO;
import com.SenaiCommunity.BackEnd.DTO.MensagemGrupoSaidaDTO;
import com.SenaiCommunity.BackEnd.Entity.MensagemGrupo;
import com.SenaiCommunity.BackEnd.Entity.Projeto;
import com.SenaiCommunity.BackEnd.Entity.Usuario;
import com.SenaiCommunity.BackEnd.Repository.MensagemGrupoRepository;
import com.SenaiCommunity.BackEnd.Repository.ProjetoRepository;
import com.SenaiCommunity.BackEnd.Repository.UsuarioRepository;
// ✅ 1. Importar o repositório de Membros
import com.SenaiCommunity.BackEnd.Repository.ProjetoMembroRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MensagemGrupoService {

    @Autowired
    private MensagemGrupoRepository mensagemGrupoRepository;

    @Autowired
    private ProjetoRepository projetoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // ✅ 2. Injetar o repositório
    @Autowired
    private ProjetoMembroRepository projetoMembroRepository;

    // Converte a entidade MensagemGrupo para o DTO de saída
    private MensagemGrupoSaidaDTO converterParaDTO(MensagemGrupo msg) {
        // ... (Este método estava correto na última versão) ...
        MensagemGrupoSaidaDTO dto = new MensagemGrupoSaidaDTO();
        dto.setId(msg.getId());
        dto.setConteudo(msg.getConteudo());
        dto.setDataEnvio(msg.getDataEnvio());
        dto.setDataEdicao(msg.getDataEdicao());
        dto.setGrupoId(msg.getProjeto().getId());

        if (msg.getAutor() != null) {
            dto.setAutorId(msg.getAutor().getId());
            dto.setNomeAutor(msg.getAutor().getNome());

            String fotoMembro = msg.getAutor().getFotoPerfil();
            String urlFotoCorrigida = null;
            if (fotoMembro != null && !fotoMembro.isBlank()) {
                if (fotoMembro.startsWith("http")) {
                    urlFotoCorrigida = fotoMembro; // Cloudinary/Google
                } else {
                    urlFotoCorrigida = "/api/arquivos/" + fotoMembro; // Local
                }
            }
            dto.setFotoAutorUrl(urlFotoCorrigida);

        } else {
            dto.setNomeAutor("Sistema");
        }
        return dto;
    }

    public List<MensagemGrupoSaidaDTO> buscarMensagensPorGrupo(Long grupoId) {
        // ... (Este método estava correto) ...
        if (!projetoRepository.existsById(grupoId)) {
            return Collections.emptyList();
        }
        List<MensagemGrupo> mensagens = mensagemGrupoRepository.findByProjetoIdOrderByDataEnvioAsc(grupoId);
        return mensagens.stream()
                .map(this::converterParaDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public MensagemGrupoSaidaDTO enviarMensagem(Long grupoId, MensagemGrupoEntradaDTO dto, String emailAutor) {
        Projeto projeto = projetoRepository.findById(grupoId)
                .orElseThrow(() -> new EntityNotFoundException("Projeto (Grupo) não encontrado: " + grupoId));
        Usuario autor = usuarioRepository.findByEmail(emailAutor)
                .orElseThrow(() -> new EntityNotFoundException("Autor não encontrado: " + emailAutor));

        // ✅ 3. ADICIONA A VERIFICAÇÃO DE MEMBRO (Request 1)
        if (!projetoMembroRepository.existsByProjetoIdAndUsuarioId(grupoId, autor.getId())) {
            throw new SecurityException("Você não é membro deste projeto e não pode enviar mensagens.");
        }
        // ✅ FIM DA VERIFICAÇÃO

        MensagemGrupo mensagem = new MensagemGrupo();
        mensagem.setConteudo(dto.getConteudo());
        mensagem.setProjeto(projeto);
        mensagem.setAutor(autor);
        mensagem.setDataEnvio(LocalDateTime.now());

        MensagemGrupo mensagemSalva = mensagemGrupoRepository.save(mensagem);
        MensagemGrupoSaidaDTO dtoSaida = converterParaDTO(mensagemSalva);

        // Envia para o tópico do grupo
        messagingTemplate.convertAndSend("/topic/grupo/" + grupoId, dtoSaida);
        return dtoSaida;
    }

    // ... (Métodos criarMensagemDeSistema, editarMensagem, excluirMensagem - Sem alterações) ...
    @Transactional
    public MensagemGrupoSaidaDTO criarMensagemDeSistema(Projeto projeto, String conteudo) {
        // ...
        MensagemGrupo mensagem = new MensagemGrupo();
        mensagem.setConteudo(conteudo);
        mensagem.setProjeto(projeto);
        mensagem.setAutor(null); // Sem autor = Sistema
        mensagem.setDataEnvio(LocalDateTime.now());
        MensagemGrupo mensagemSalva = mensagemGrupoRepository.save(mensagem);
        MensagemGrupoSaidaDTO dtoSaida = converterParaDTO(mensagemSalva);
        messagingTemplate.convertAndSend("/topic/grupo/" + projeto.getId(), dtoSaida);
        return dtoSaida;
    }

    @Transactional
    public MensagemGrupoSaidaDTO editarMensagem(Long mensagemId, String novoConteudo, String emailAutor) {
        // ...
        MensagemGrupo mensagem = mensagemGrupoRepository.findById(mensagemId)
                .orElseThrow(() -> new EntityNotFoundException("Mensagem não encontrada: " + mensagemId));
        Usuario autor = usuarioRepository.findByEmail(emailAutor)
                .orElseThrow(() -> new EntityNotFoundException("Autor não encontrado: " + emailAutor));
        if (!mensagem.getAutor().getId().equals(autor.getId())) {
            throw new SecurityException("Você não tem permissão para editar esta mensagem.");
        }
        mensagem.setConteudo(novoConteudo);
        mensagem.setDataEdicao(LocalDateTime.now());
        MensagemGrupo mensagemSalva = mensagemGrupoRepository.save(mensagem);
        MensagemGrupoSaidaDTO dtoSaida = converterParaDTO(mensagemSalva);
        messagingTemplate.convertAndSend("/topic/grupo/" + mensagem.getProjeto().getId(), dtoSaida);
        return dtoSaida;
    }

    @Transactional
    public void excluirMensagem(Long mensagemId, String emailAutor) {
        // ...
        MensagemGrupo mensagem = mensagemGrupoRepository.findById(mensagemId)
                .orElseThrow(() -> new EntityNotFoundException("Mensagem não encontrada: " + mensagemId));
        Usuario autor = usuarioRepository.findByEmail(emailAutor)
                .orElseThrow(() -> new EntityNotFoundException("Autor não encontrado: " + emailAutor));
        if (!mensagem.getAutor().getId().equals(autor.getId())) {
            throw new SecurityException("Você não tem permissão para excluir esta mensagem.");
        }
        mensagemGrupoRepository.delete(mensagem);
        messagingTemplate.convertAndSend("/topic/grupo/" + mensagem.getProjeto().getId(),
                new MensagemGrupoService.RemocaoMensagemDTO(mensagemId, mensagem.getProjeto().getId()));
    }

    private static class RemocaoMensagemDTO {
        // ...
        public String tipo = "remocao";
        public Long id;
        public Long grupoId;
        public RemocaoMensagemDTO(Long id, Long grupoId) {
            this.id = id;
            this.grupoId = grupoId;
        }
    }
}