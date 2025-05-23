package com.SenaiCommunity.BackEnd.Controller;

import com.SenaiCommunity.BackEnd.DTO.AvaliacoesDTO;
import com.SenaiCommunity.BackEnd.Service.AvaliacoesService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/avaliacoes")
@RequiredArgsConstructor
public class AvaliacoesController {

    private final AvaliacoesService avaliacoesService;

    @PostMapping
    public ResponseEntity<AvaliacoesDTO> criar(@RequestBody AvaliacoesDTO dto) {
        return ResponseEntity.ok(avaliacoesService.salvar(dto));
    }

    @GetMapping
    public ResponseEntity<List<AvaliacoesDTO>> listar() {
        return ResponseEntity.ok(avaliacoesService.listarTodos());
    }

    @GetMapping("/projeto/{projetoId}")
    public ResponseEntity<List<AvaliacoesDTO>> listarPorProjeto(@PathVariable Long projetoId) {
        return ResponseEntity.ok(avaliacoesService.listarPorProjeto(projetoId));
    }
}
