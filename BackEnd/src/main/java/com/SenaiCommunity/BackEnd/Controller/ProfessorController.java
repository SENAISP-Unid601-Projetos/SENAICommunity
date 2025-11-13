package com.SenaiCommunity.BackEnd.Controller;

import com.SenaiCommunity.BackEnd.DTO.ProfessorEntradaDTO;
import com.SenaiCommunity.BackEnd.DTO.ProfessorSaidaDTO;
import com.SenaiCommunity.BackEnd.Service.ProfessorService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/professores")
public class ProfessorController {

    @Autowired
    private ProfessorService professorService;

    @GetMapping
    public ResponseEntity<List<ProfessorSaidaDTO>> listar() {
        return ResponseEntity.ok(professorService.listarTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProfessorSaidaDTO> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(professorService.buscarPorId(id));
    }

    @PutMapping(value = "/{id}", consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
    public ResponseEntity<ProfessorSaidaDTO> atualizarProfessor(
            @PathVariable Long id,
            @RequestPart("dados") ProfessorEntradaDTO dto,
            @RequestPart(name = "foto", required = false) MultipartFile foto) {

        try {

            ProfessorSaidaDTO atualizado = professorService.atualizarProfessor(id, dto, foto);
            return ResponseEntity.ok(atualizado);

        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (IOException e) {

            System.err.println("Erro ao atualizar professor: " + e.getMessage());
            return ResponseEntity.badRequest().body(null);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(null);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        professorService.deletarProfessor(id);
        return ResponseEntity.noContent().build();
    }

}
