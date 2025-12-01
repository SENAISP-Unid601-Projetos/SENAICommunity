package com.SenaiCommunity.BackEnd.Service;

import com.SenaiCommunity.BackEnd.DTO.EventoEntradaDTO;
import com.SenaiCommunity.BackEnd.DTO.EventoSaidaDTO;
import com.SenaiCommunity.BackEnd.DTO.UsuarioSaidaDTO;
import com.SenaiCommunity.BackEnd.Entity.Evento;
import com.SenaiCommunity.BackEnd.Entity.Usuario;
import com.SenaiCommunity.BackEnd.Exception.ConteudoImproprioException;
import com.SenaiCommunity.BackEnd.Repository.EventoRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class EventoService {

    @Autowired
    private EventoRepository eventoRepository;

    @Autowired
    private FiltroProfanidadeService filtroProfanidade;

    @Autowired
    private ArquivoMidiaService midiaService;

    @Autowired
    private UsuarioService usuarioService; // Necessário para buscar usuário logado

    @Autowired
    private NotificacaoService notificacaoService; // Para enviar confirmação do lembrete

    private static final String IMAGEM_PADRAO = "/images/default-event.png";

    private Evento toEntity(EventoEntradaDTO dto) {
        Evento evento = new Evento();
        evento.setNome(dto.getNome());
        evento.setData(dto.getData());
        evento.setLocal(dto.getLocal());
        evento.setFormato(dto.getFormato());
        evento.setCategoria(dto.getCategoria());
        evento.setHoraInicio(dto.getHoraInicio()); // NOVO
        evento.setHoraFim(dto.getHoraFim());
        evento.setDescricao(dto.getDescricao());
        return evento;
    }

    private EventoSaidaDTO toDTO(Evento evento) {
        EventoSaidaDTO dto = new EventoSaidaDTO();
        dto.setId(evento.getId());
        dto.setNome(evento.getNome());
        dto.setData(evento.getData());
        dto.setLocal(evento.getLocal());
        dto.setFormato(evento.getFormato());
        dto.setCategoria(evento.getCategoria());
        dto.setHoraInicio(evento.getHoraInicio()); // NOVO
        dto.setHoraFim(evento.getHoraFim());
        dto.setDescricao(evento.getDescricao());

        if (evento.getInteressados() != null) {
            dto.setNumeroInteressados(evento.getInteressados().size());
        } else {
            dto.setNumeroInteressados(0);
        }

        if (evento.getImagemCapa() != null && !evento.getImagemCapa().isBlank()) {
            dto.setImagemCapaUrl(evento.getImagemCapa());
        } else {
            dto.setImagemCapaUrl(IMAGEM_PADRAO);
        }
        return dto;
    }

    public EventoSaidaDTO criarEventoComImagem(EventoEntradaDTO dto, MultipartFile imagem) {
        validarConteudo(dto);

        Evento evento = toEntity(dto);

        if (imagem != null && !imagem.isEmpty()) {
            try {
                String urlCloudinary = midiaService.upload(imagem);
                evento.setImagemCapa(urlCloudinary);
            } catch (IOException e) {
                throw new RuntimeException("Erro ao salvar a imagem de capa do evento", e);
            }
        }

        Evento eventoSalvo = eventoRepository.save(evento);
        return toDTO(eventoSalvo);
    }

    // NOVO: Método para editar evento
    public EventoSaidaDTO atualizarEvento(Long id, EventoEntradaDTO dto, MultipartFile imagem) {
        Evento evento = eventoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Evento não encontrado."));

        validarConteudo(dto);

        // Verifica se houve mudança de data ou horário antes de atualizar os dados
        boolean horarioMudou = !evento.getData().equals(dto.getData()) ||
                !evento.getHoraInicio().equals(dto.getHoraInicio()) ||
                (dto.getHoraFim() != null && !dto.getHoraFim().equals(evento.getHoraFim()));

        // Atualiza dados básicos
        evento.setNome(dto.getNome());
        evento.setData(dto.getData());
        evento.setLocal(dto.getLocal());
        evento.setFormato(dto.getFormato());
        evento.setCategoria(dto.getCategoria());
        evento.setHoraInicio(dto.getHoraInicio());
        evento.setHoraFim(dto.getHoraFim());
        evento.setDescricao(dto.getDescricao());

        // SE o horário mudou, resetamos as notificações para que sejam enviadas novamente
        if (horarioMudou) {
            evento.setNotificacaoInicioEnviada(false);
            evento.setNotificacaoFimEnviada(false);
        }

        // Se enviou nova imagem, substitui a antiga
        if (imagem != null && !imagem.isEmpty()) {
            try {
                // Opcional: Deletar imagem antiga do Cloudinary antes de subir a nova
                if (evento.getImagemCapa() != null) {
                    midiaService.deletar(evento.getImagemCapa());
                }
                String urlCloudinary = midiaService.upload(imagem);
                evento.setImagemCapa(urlCloudinary);
            } catch (IOException e) {
                throw new RuntimeException("Erro ao atualizar a imagem do evento", e);
            }
        }

        Evento eventoAtualizado = eventoRepository.save(evento);
        return toDTO(eventoAtualizado);
    }

    // NOVO: Método para Aluno/Professor registrar interesse (Lembrete)
    public boolean alternarInteresse(Long eventoId, Authentication authentication) {
        UsuarioSaidaDTO usuarioLogadoDTO = usuarioService.buscarUsuarioLogado(authentication);
        Usuario usuario = usuarioService.buscarEntidadePorId(usuarioLogadoDTO.getId());

        Evento evento = eventoRepository.findById(eventoId)
                .orElseThrow(() -> new EntityNotFoundException("Evento não encontrado."));

        // Verifica se já está na lista de interessados
        if (evento.getInteressados().contains(usuario)) {
            evento.getInteressados().remove(usuario);
            eventoRepository.save(evento);
            return false; // Removeu interesse
        } else {
            evento.getInteressados().add(usuario);
            eventoRepository.save(evento);

            // Cria notificação de confirmação
            notificacaoService.criarNotificacao(
                    usuario,
                    "Lembrete definido para o evento: " + evento.getNome(),
                    "EVENTO",
                    evento.getId()
            );

            return true; // Adicionou interesse
        }
    }

    private void validarConteudo(EventoEntradaDTO dto) {
        if (filtroProfanidade.contemProfanidade(dto.getNome()) ||
                filtroProfanidade.contemProfanidade(dto.getLocal())) {
            throw new ConteudoImproprioException("Os dados do evento contêm texto não permitido.");
        }
    }

    public List<EventoSaidaDTO> listarTodos() {
        return eventoRepository.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    public EventoSaidaDTO buscarPorId(Long id) {
        Evento evento = eventoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Evento com ID " + id + " não encontrado."));
        return toDTO(evento);
    }

    public void deletar(Long id) {
        if (!eventoRepository.existsById(id)) {
            throw new EntityNotFoundException("Evento com ID " + id + " não encontrado.");
        }

        eventoRepository.findById(id).ifPresent(evt -> {
            try {
                midiaService.deletar(evt.getImagemCapa());
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
        });
        eventoRepository.deleteById(id);
    }

    public List<EventoSaidaDTO> listarEventosPorInteresse(Authentication authentication) {
        UsuarioSaidaDTO usuarioLogadoDTO = usuarioService.buscarUsuarioLogado(authentication);
        Usuario usuario = usuarioService.buscarEntidadePorId(usuarioLogadoDTO.getId());

        return eventoRepository.findByInteressadosContaining(usuario)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
}