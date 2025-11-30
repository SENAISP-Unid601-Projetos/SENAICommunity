package com.SenaiCommunity.BackEnd.Controller;

import com.SenaiCommunity.BackEnd.DTO.VagaEntradaDTO;
import com.SenaiCommunity.BackEnd.DTO.VagaSaidaDTO;
import com.SenaiCommunity.BackEnd.Service.VagaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.nio.file.AccessDeniedException;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/vagas")
public class VagaController {

    @Autowired
    private VagaService vagaService;

    // Endpoint PÚBLICO para listar todas as vagas
    @GetMapping
    public ResponseEntity<List<VagaSaidaDTO>> listarVagas() {
        return ResponseEntity.ok(vagaService.listarTodas());
    }


    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESSOR')")
    public ResponseEntity<VagaSaidaDTO> criarVaga(@RequestBody VagaEntradaDTO dto, Principal principal) {
        VagaSaidaDTO vagaCriada = vagaService.criar(dto, principal.getName());
        return ResponseEntity.status(201).body(vagaCriada);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESSOR')")
    public ResponseEntity<VagaSaidaDTO> atualizarVaga(@PathVariable Long id, @RequestBody VagaEntradaDTO dto, Principal principal) throws AccessDeniedException {
        return ResponseEntity.ok(vagaService.atualizar(id, dto, principal.getName()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESSOR')")
    public ResponseEntity<Void> excluirVaga(@PathVariable Long id, Principal principal) {
        vagaService.excluir(id, principal.getName());
        return ResponseEntity.noContent().build();
    }
}