package com.SenaiCommunity.BackEnd.Controller;

import com.SenaiCommunity.BackEnd.DTO.VagaEntradaDTO;
import com.SenaiCommunity.BackEnd.DTO.VagaSaidaDTO;
import com.SenaiCommunity.BackEnd.Service.VagaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.AccessDeniedException;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/vagas")
@PreAuthorize("hasAnyRole('ADMIN', 'PROFESSOR')")
public class VagaController {

    @Autowired
    private VagaService vagaService;

    // Endpoint PÚBLICO para listar todas as vagas
    @GetMapping
    @PreAuthorize("hasRole('ALUNO') or hasRole('PROFESSOR') or hasRole('ADMIN')")
    public ResponseEntity<List<VagaSaidaDTO>> listarVagas() {
        return ResponseEntity.ok(vagaService.listarTodas());
    }

    @PostMapping(consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESSOR')")
    public ResponseEntity<VagaSaidaDTO> criarVaga(
            @RequestPart("vaga") VagaEntradaDTO dto,
            @RequestPart(value = "imagem", required = false) MultipartFile imagem,
            Principal principal) {

        // Passa o DTO e a Imagem para o Service
        VagaSaidaDTO vagaCriada = vagaService.criar(dto, principal.getName(), imagem);
        return ResponseEntity.status(201).body(vagaCriada);
    }

    @PutMapping(value = "/{id}", consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESSOR')")
    public ResponseEntity<VagaSaidaDTO> atualizarVaga(
            @PathVariable Long id,
            @RequestPart("vaga") VagaEntradaDTO dto,
            @RequestPart(value = "imagem", required = false) MultipartFile imagem,
            Principal principal) throws AccessDeniedException {

        return ResponseEntity.ok(vagaService.atualizar(id, dto, principal.getName(), imagem));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESSOR')")
    public ResponseEntity<Void> excluirVaga(@PathVariable Long id, Principal principal) {
        vagaService.excluir(id, principal.getName());
        return ResponseEntity.noContent().build();
    }
}