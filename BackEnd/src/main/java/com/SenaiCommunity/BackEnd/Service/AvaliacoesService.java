package com.SenaiCommunity.BackEnd.Service;

import com.SenaiCommunity.BackEnd.DTO.AvaliacoesDTO;
import com.SenaiCommunity.BackEnd.Entity.Avaliacoes;
import com.SenaiCommunity.BackEnd.Entity.Projeto;
import com.SenaiCommunity.BackEnd.Entity.Usuario;
import com.SenaiCommunity.BackEnd.Repository.AvaliacoesRepository;
import com.SenaiCommunity.BackEnd.Repository.ProjetoRepository;
import com.SenaiCommunity.BackEnd.Repository.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AvaliacoesService {

    private final AvaliacoesRepository avaliacoesRepository;
    private final UsuarioRepository usuarioRepository;
    private final ProjetoRepository projetoRepository;

    public AvaliacoesDTO salvar(AvaliacoesDTO dto) {
        Avaliacoes avaliacao = new Avaliacoes();
        avaliacao.setEstrelas(dto.getEstrelas());
        avaliacao.setDataAvaliacao(dto.getDataAvaliacao());
        avaliacao.setComentario(dto.getComentario());

        Usuario usuario = usuarioRepository.findById(dto.getUsuarioId())
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado"));

        Projeto projeto = projetoRepository.findById(dto.getProjetoId())
                .orElseThrow(() -> new EntityNotFoundException("Projeto não encontrado"));

        avaliacao.setUsuario(usuario);
        avaliacao.setProjeto(projeto);

        Avaliacoes salvo = avaliacoesRepository.save(avaliacao);
        return toDTO(salvo);
    }

    public List<AvaliacoesDTO> listarTodos() {
        return avaliacoesRepository.findAll()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<AvaliacoesDTO> listarPorProjeto(Long projetoId) {
        return avaliacoesRepository.findByProjetoId(projetoId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    private AvaliacoesDTO toDTO(Avaliacoes avaliacao) {
        AvaliacoesDTO dto = new AvaliacoesDTO();
        dto.setId(avaliacao.getId());
        dto.setEstrelas(avaliacao.getEstrelas());
        dto.setDataAvaliacao(avaliacao.getDataAvaliacao());
        dto.setComentario(avaliacao.getComentario());
        dto.setUsuarioId(avaliacao.getUsuario().getId());
        dto.setProjetoId(avaliacao.getProjeto().getId());
        return dto;
    }
}
