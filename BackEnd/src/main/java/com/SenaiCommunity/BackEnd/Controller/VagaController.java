package com.SenaiCommunity.BackEnd.Controller;

import com.SenaiCommunity.BackEnd.DTO.VagaDTO;
import com.SenaiCommunity.BackEnd.Service.VagaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/vagas")
public class VagaController {

    @Autowired
    private VagaService vagaService;

    @GetMapping
    public List<VagaDTO> listarVagas(
            @RequestParam(required = false, defaultValue = "") String busca,
            @RequestParam(required = false, defaultValue = "todos") String tipo,
            @RequestParam(required = false, defaultValue = "todos") String local,
            @RequestParam(required = false, defaultValue = "todos") String nivel
    ) {
        return vagaService.listarVagas(busca, tipo, local, nivel);
    }
}