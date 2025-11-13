package com.SenaiCommunity.BackEnd.Service;

import com.SenaiCommunity.BackEnd.DTO.EventoEntradaDTO;
import com.SenaiCommunity.BackEnd.DTO.EventoSaidaDTO;
import com.SenaiCommunity.BackEnd.Entity.Evento;
import com.SenaiCommunity.BackEnd.Exception.ConteudoImproprioException;
import com.SenaiCommunity.BackEnd.Repository.EventoRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
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

    private Evento toEntity(EventoEntradaDTO dto) {
        Evento evento = new Evento();
        evento.setNome(dto.getNome());
        evento.setData(dto.getData());
        evento.setLocal(dto.getLocal());
        evento.setFormato(dto.getFormato());
        evento.setCategoria(dto.getCategoria());
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

        if (evento.getImagemCapa() != null) {
            dto.setImagemCapaUrl(evento.getImagemCapa());
        }
        return dto;
    }

    public EventoSaidaDTO criarEventoComImagem(EventoEntradaDTO dto, MultipartFile imagem) {

        if (filtroProfanidade.contemProfanidade(dto.getNome()) ||
                filtroProfanidade.contemProfanidade(dto.getLocal())) {
            throw new ConteudoImproprioException("Os dados do evento contêm texto não permitido.");
        }

        Evento evento = toEntity(dto);

        if (imagem != null && !imagem.isEmpty()) {
            try {

                String urlCloudinary = midiaService.upload(imagem);
                evento.setImagemCapa(urlCloudinary); // Salva a URL completa
            } catch (IOException e) {
                throw new RuntimeException("Erro ao salvar a imagem de capa do evento", e);
            }
        }

        Evento eventoSalvo = eventoRepository.save(evento);
        return toDTO(eventoSalvo);
    }

    // ... outros métodos CRUD ...
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
        eventoRepository.deleteById(id);
    }
}