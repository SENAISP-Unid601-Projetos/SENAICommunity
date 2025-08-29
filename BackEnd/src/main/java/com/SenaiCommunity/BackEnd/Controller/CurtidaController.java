package com.SenaiCommunity.BackEnd.Controller;

import com.SenaiCommunity.BackEnd.DTO.CurtidaEntradaDTO;
import com.SenaiCommunity.BackEnd.Service.CurtidaService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
@RequestMapping("/curtidas")
@PreAuthorize("hasRole('ALUNO') or hasRole('PROFESSOR')")
public class CurtidaController {

    @Autowired
    private CurtidaService curtidaService;

    @PostMapping("/toggle")
    public ResponseEntity<?> toggleCurtida(@RequestBody CurtidaEntradaDTO dto, Principal principal) {
        try {
            curtidaService.toggleCurtida(principal.getName(), dto.getPostagemId(), dto.getComentarioId());
            return ResponseEntity.ok().build();
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }
}
