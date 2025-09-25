package com.SenaiCommunity.BackEnd.Service;

import com.SenaiCommunity.BackEnd.DTO.VagaDTO;
import com.SenaiCommunity.BackEnd.Entity.Vaga;
import com.SenaiCommunity.BackEnd.Repository.VagaRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.Period;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class VagaService {

    @Autowired
    private VagaRepository vagaRepository;

    public List<VagaDTO> listarVagas(String busca, String tipo, String local, String nivel) {
        Specification<Vaga> spec = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (busca != null && !busca.isBlank()) {
                String buscaLike = "%" + busca.toLowerCase() + "%";
                predicates.add(criteriaBuilder.or(
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("titulo")), buscaLike),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("empresa")), buscaLike),
                        criteriaBuilder.like(criteriaBuilder.lower(root.get("descricao")), buscaLike)
                ));
            }

            if (tipo != null && !tipo.equals("todos")) {
                predicates.add(criteriaBuilder.equal(root.get("tipo"), tipo));
            }
            if (local != null && !local.equals("todos")) {
                predicates.add(criteriaBuilder.equal(root.get("local"), local));
            }
            if (nivel != null && !nivel.equals("todos")) {
                predicates.add(criteriaBuilder.equal(root.get("nivel"), nivel));
            }

            query.orderBy(criteriaBuilder.desc(root.get("dataPublicacao")));

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        return vagaRepository.findAll(spec).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    private VagaDTO toDTO(Vaga vaga) {
        VagaDTO dto = new VagaDTO();
        dto.setId(vaga.getId());
        dto.setTitulo(vaga.getTitulo());
        dto.setEmpresa(vaga.getEmpresa());
        dto.setLogoUrl(vaga.getLogoUrl());
        dto.setLocal(vaga.getLocal());
        dto.setCidade(vaga.getCidade());
        dto.setNivel(vaga.getNivel());
        dto.setTipo(vaga.getTipo());
        dto.setDescricao(vaga.getDescricao());
        dto.setDataPublicacao(vaga.getDataPublicacao());
        dto.setTags(vaga.getTags());
        dto.setPublicado(formatarDataPublicacao(vaga.getDataPublicacao()));
        return dto;
    }

    private String formatarDataPublicacao(LocalDate data) {
        if (data == null) return "";
        Period period = Period.between(data, LocalDate.now());
        if (period.getYears() > 0) return "há " + period.getYears() + (period.getYears() > 1 ? " anos" : " ano");
        if (period.getMonths() > 0) return "há " + period.getMonths() + (period.getMonths() > 1 ? " meses" : " mês");
        if (period.getDays() > 7) return "há " + (period.getDays() / 7) + " semanas";
        if (period.getDays() > 0) return "há " + period.getDays() + (period.getDays() > 1 ? " dias" : " dia");
        return "hoje";
    }
}