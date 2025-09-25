package com.SenaiCommunity.BackEnd.Service;

import com.SenaiCommunity.BackEnd.DTO.EventoEntradaDTO;
import com.SenaiCommunity.BackEnd.DTO.EventoSaidaDTO;
import com.SenaiCommunity.BackEnd.Entity.Evento;
import com.SenaiCommunity.BackEnd.Enum.CategoriaEvento;
import com.SenaiCommunity.BackEnd.Enum.FormatoEvento;
import com.SenaiCommunity.BackEnd.Repository.EventoRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.criteria.Predicate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class EventoService {

    @Autowired
    private EventoRepository eventoRepository;

    @Value("${file.upload-dir}")
    private String uploadDir;

    public List<EventoSaidaDTO> listarEventos(String busca, String periodo, String formato, String categoria) {
        Specification<Evento> spec = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (busca != null && !busca.isBlank()) {
                predicates.add(criteriaBuilder.like(criteriaBuilder.lower(root.get("nome")), "%" + busca.toLowerCase() + "%"));
            }

            if (periodo != null && !periodo.equals("todos")) {
                if ("proximos".equalsIgnoreCase(periodo)) {
                    predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("data"), LocalDate.now()));
                } else if ("passados".equalsIgnoreCase(periodo)) {
                    predicates.add(criteriaBuilder.lessThan(root.get("data"), LocalDate.now()));
                }
            }

            if (formato != null && !formato.equals("todos")) {
                try {
                    FormatoEvento formatoEnum = FormatoEvento.valueOf(formato.toUpperCase());
                    predicates.add(criteriaBuilder.equal(root.get("formato"), formatoEnum));
                } catch (IllegalArgumentException e) {}
            }

            if (categoria != null && !categoria.equals("todos")) {
                try {
                    CategoriaEvento categoriaEnum = CategoriaEvento.valueOf(categoria.toUpperCase());
                    predicates.add(criteriaBuilder.equal(root.get("categoria"), categoriaEnum));
                } catch (IllegalArgumentException e) {}
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        List<Evento> eventos = eventoRepository.findAll(spec);
        return eventos.stream().map(this::toDTO).collect(Collectors.toList());
    }

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

        if (evento.getImagemCapa() != null && !evento.getImagemCapa().isBlank()) {
            // Apenas passa a URL que já está completa no banco de dados.
            dto.setImagemCapaUrl(evento.getImagemCapa());
        } else {
            dto.setImagemCapaUrl("https://placehold.co/600x400/161b22/ffffff?text=Evento");
        }
        return dto;
    }

    private String salvarImagemCapa(MultipartFile imagem) throws IOException {
        String nomeOriginal = StringUtils.cleanPath(imagem.getOriginalFilename());
        String nomeUnico = UUID.randomUUID().toString() + "_" + nomeOriginal;

        Path diretorio = Paths.get(uploadDir);
        Files.createDirectories(diretorio);

        Path caminhoDoArquivo = diretorio.resolve(nomeUnico);
        Files.copy(imagem.getInputStream(), caminhoDoArquivo, StandardCopyOption.REPLACE_EXISTING);

        return nomeUnico;
    }

    public EventoSaidaDTO criarEventoComImagem(EventoEntradaDTO dto, MultipartFile imagem) {
        Evento evento = toEntity(dto);

        if (imagem != null && !imagem.isEmpty()) {
            try {
                String nomeArquivo = salvarImagemCapa(imagem);
                evento.setImagemCapa(nomeArquivo);
            } catch (IOException e) {
                throw new RuntimeException("Erro ao salvar a imagem de capa do evento", e);
            }
        }

        Evento eventoSalvo = eventoRepository.save(evento);
        return toDTO(eventoSalvo);
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