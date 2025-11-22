package com.SenaiCommunity.BackEnd.Controller;

import com.SenaiCommunity.BackEnd.DTO.VagaEntradaDTO;
import com.SenaiCommunity.BackEnd.DTO.VagaSaidaDTO;
import com.SenaiCommunity.BackEnd.Service.VagaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/vagas")
public class VagaController {

    @Autowired
    private VagaService vagaService;

    @GetMapping
    public ResponseEntity<List<VagaSaidaDTO>> listarVagas() {
        return ResponseEntity.ok(vagaService.listarTodas());
    }

    @PostMapping
    // ✅ Atualizado para incluir SUPERVISOR
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESSOR', 'SUPERVISOR')")
    public ResponseEntity<VagaSaidaDTO> criarVaga(@RequestBody VagaEntradaDTO dto, Principal principal) {
        VagaSaidaDTO vagaCriada = vagaService.criar(dto, principal.getName());
        return ResponseEntity.status(201).body(vagaCriada);
    }
}