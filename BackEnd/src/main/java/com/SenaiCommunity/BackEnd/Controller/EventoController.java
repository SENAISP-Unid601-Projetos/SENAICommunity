package com.SenaiCommunity.BackEnd.Controller;

import com.SenaiCommunity.BackEnd.DTO.EventoEntradaDTO;
import com.SenaiCommunity.BackEnd.DTO.EventoSaidaDTO;
import com.SenaiCommunity.BackEnd.Service.EventoService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/eventos")
public class EventoController {

    @Autowired
    private EventoService eventoService;

    @GetMapping("/meus-eventos")
    public ResponseEntity<List<EventoSaidaDTO>> listarMeusEventos(Authentication authentication) {
        try {
            List<EventoSaidaDTO> eventos = eventoService.listarEventosPorInteresse(authentication);
            return ResponseEntity.ok(eventos);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Apenas ADMIN pode criar
    @PostMapping(consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public EventoSaidaDTO criarEvento(
            @RequestPart("evento") EventoEntradaDTO eventoDTO,
            @RequestPart(name = "imagem", required = false) MultipartFile imagem) {

        return eventoService.criarEventoComImagem(eventoDTO, imagem);
    }

    // Apenas ADMIN pode editar (NOVO ENDPOINT)
    @PutMapping(value = "/{id}", consumes = { MediaType.MULTIPART_FORM_DATA_VALUE })
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EventoSaidaDTO> atualizarEvento(
            @PathVariable Long id,
            @RequestPart("evento") EventoEntradaDTO eventoDTO,
            @RequestPart(name = "imagem", required = false) MultipartFile imagem) {

        try {
            EventoSaidaDTO eventoAtualizado = eventoService.atualizarEvento(id, eventoDTO, imagem);
            return ResponseEntity.ok(eventoAtualizado);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Todos (Aluno, Professor, Admin) podem visualizar
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

    // Apenas ADMIN pode deletar
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        try {
            eventoService.deletar(id);
            return ResponseEntity.noContent().build();
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // NOVO: Endpoint para marcar interesse/lembrete (Qualquer usuário autenticado)
    @PostMapping("/{id}/interesse")
    public ResponseEntity<String> alternarInteresse(@PathVariable Long id, Authentication authentication) {
        try {
            boolean interessado = eventoService.alternarInteresse(id, authentication);
            String mensagem = interessado ? "Lembrete definido com sucesso." : "Lembrete removido.";
            return ResponseEntity.ok(mensagem);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }
}