package com.SenaiCommunity.BackEnd.Service;


import com.SenaiCommunity.BackEnd.DTO.AvaliacoesDTO;
import com.SenaiCommunity.BackEnd.Entity.Avaliacoes;
import com.SenaiCommunity.BackEnd.Entity.Projeto;
import com.SenaiCommunity.BackEnd.Entity.Usuario;
import com.SenaiCommunity.BackEnd.Repository.AvaliacoesRepository;
import com.SenaiCommunity.BackEnd.Repository.ProjetoRepository;
import com.SenaiCommunity.BackEnd.Repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AvaliacoesService {

    private final AvaliacoesRepository avaliacoesRepository;
    private final UsuarioRepository usuarioRepository;
    private final ProjetoRepository projetoRepository;

    public Avaliacoes criarAvaliacao(AvaliacoesDTO dto) {
        Usuario usuario = usuarioRepository.findById(dto.getUsuarioId())
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        Projeto projeto = projetoRepository.findById(dto.getProjetoId())
                .orElseThrow(() -> new RuntimeException("Projeto não encontrado"));

        Avaliacoes avaliacao = new Avaliacoes();
        avaliacao.setEstrelas(dto.getEstrelas());
        avaliacao.setComentario(dto.getComentario());
        avaliacao.setDataAvaliacao(LocalDate.now());
        avaliacao.setUsuario(usuario);
        avaliacao.setProjeto(projeto);

        return avaliacoesRepository.save(avaliacao);
    }

    public List<Avaliacoes> listarTodas() {
        return avaliacoesRepository.findAll();
    }

    public List<Avaliacoes> listarPorProjeto(Long projetoId) {
        return avaliacoesRepository.findByProjetoId(projetoId);
    }
}
