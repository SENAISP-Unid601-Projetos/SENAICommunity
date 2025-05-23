package com.SenaiCommunity.BackEnd.Controller;

import org.springframework.stereotype.Controller;

import com.SenaiCommunity.BackEnd.Dto.TelefoneDto;
import com.SenaiCommunity.BackEnd.Service.TelefoneService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/telefones")
public class TelefoneController {

    @Autowired
    private TelefoneService telefoneService;

    @PostMapping
    public TelefoneDto salvar(@RequestBody TelefoneDto dto) {
        return telefoneService.salvar(dto);
    }

    @GetMapping("/usuario/{usuarioId}")
    public List<TelefoneDto> listarPorUsuario(@PathVariable Long usuarioId) {
        return telefoneService.listarPorUsuario(usuarioId);
    }

    @GetMapping("/{id}")
    public TelefoneDto buscarPorId(@PathVariable Long id) {
        return telefoneService.buscarPorId(id);
    }

    @DeleteMapping("/{id}")
    public void deletar(@PathVariable Long id) {
        telefoneService.deletar(id);
    }
}
