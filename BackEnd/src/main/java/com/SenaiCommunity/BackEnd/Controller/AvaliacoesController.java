package com.SenaiCommunity.BackEnd.Controller;

import com.SenaiCommunity.BackEnd.DTO.AvaliacoesDTO;
import com.SenaiCommunity.BackEnd.Entity.Avaliacoes;
import com.SenaiCommunity.BackEnd.Service.AvaliacoesService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
@PreAuthorize("hasRole('ADMIN')")
@RestController
@RequestMapping("/avaliacoes")
@RequiredArgsConstructor
public class AvaliacoesController {

    private final AvaliacoesService avaliacaoService;

    @PostMapping
    public Avaliacoes criar(@RequestBody AvaliacoesDTO dto) {
        return avaliacaoService.criarAvaliacao(dto);
    }

    @GetMapping
    public List<Avaliacoes> listar() {
        return avaliacaoService.listarTodas();
    }

    @GetMapping("/projeto/{id}")
    public List<Avaliacoes> listarPorProjeto(@PathVariable Long id) {
        return avaliacaoService.listarPorProjeto(id);
    }
}
