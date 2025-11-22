package com.SenaiCommunity.BackEnd.Controller;

import com.SenaiCommunity.BackEnd.DTO.EventoEntradaDTO;
import com.SenaiCommunity.BackEnd.DTO.EventoSaidaDTO;
import com.SenaiCommunity.BackEnd.Service.EventoService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize; // ✅ Importante
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/eventos")
public class EventoController {

    @Autowired
    private EventoService eventoService;

    @PostMapping(consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
    @ResponseStatus(HttpStatus.CREATED)
    // ✅ Adicionada permissão para SUPERVISOR
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESSOR', 'SUPERVISOR')")
    public EventoSaidaDTO criarEvento(
            @RequestPart("evento") EventoEntradaDTO eventoDTO,
            @RequestPart(name = "imagem", required = false) MultipartFile imagem) {

        return eventoService.criarEventoComImagem(eventoDTO, imagem);
    }

    @GetMapping
    public List<EventoSaidaDTO> listarTodos() {
        return eventoService.listarTodos();
    }

    @GetMapping("/{id}")
    public ResponseEntity<EventoSaidaDTO> buscarPorId(@PathVariable Long id) {
        try {
            EventoSaidaDTO dto = eventoService.buscarPorId(id);
            return ResponseEntity.ok(dto);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    // ✅ Opcional: Restringir quem pode deletar
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPERVISOR')")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        try {
            eventoService.deletar(id);
            return ResponseEntity.noContent().build();
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }
}