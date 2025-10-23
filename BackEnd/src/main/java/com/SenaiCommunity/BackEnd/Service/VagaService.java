package com.SenaiCommunity.BackEnd.Service;

import com.SenaiCommunity.BackEnd.DTO.VagaEntradaDTO;
import com.SenaiCommunity.BackEnd.DTO.VagaSaidaDTO;
import com.SenaiCommunity.BackEnd.Entity.Usuario;
import com.SenaiCommunity.BackEnd.Entity.Vaga;
import com.SenaiCommunity.BackEnd.Repository.UsuarioRepository;
import com.SenaiCommunity.BackEnd.Repository.VagaRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class VagaService {

    @Autowired
    private VagaRepository vagaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private NotificacaoService notificacaoService;

    @Transactional
    public VagaSaidaDTO criar(VagaEntradaDTO dto, String autorEmail) {
        Usuario autor = usuarioRepository.findByEmail(autorEmail)
                .orElseThrow(() -> new EntityNotFoundException("Usuário autor não encontrado."));

        Vaga vaga = new Vaga();
        vaga.setTitulo(dto.getTitulo());
        vaga.setDescricao(dto.getDescricao());
        vaga.setEmpresa(dto.getEmpresa());
        vaga.setLocalizacao(dto.getLocalizacao());
        vaga.setNivel(dto.getNivel());
        vaga.setTipoContratacao(dto.getTipoContratacao());
        vaga.setDataPublicacao(LocalDateTime.now());
        vaga.setAutor(autor);

        Vaga vagaSalva = vagaRepository.save(vaga);

        // Após salvar a vaga, notifica todos os outros usuários.
        List<Usuario> todosOsUsuarios = usuarioRepository.findAll();
        String mensagem = String.format("Nova vaga publicada: '%s' na empresa %s.", vagaSalva.getTitulo(), vagaSalva.getEmpresa());

        for (Usuario destinatario : todosOsUsuarios) {
            // Não envia notificação para o próprio autor da vaga
            if (!destinatario.getId().equals(autor.getId())) {
                notificacaoService.criarNotificacao(
                        destinatario,
                        mensagem,
                        "NOVA_VAGA",
                        vagaSalva.getId()
                );
            }
        }

        return new VagaSaidaDTO(vagaSalva);
    }

    public List<VagaSaidaDTO> listarTodas() {
        return vagaRepository.findAll().stream()
                .map(VagaSaidaDTO::new)
                .collect(Collectors.toList());
    }

    // Adicione outros métodos como atualizar, deletar, etc.
}