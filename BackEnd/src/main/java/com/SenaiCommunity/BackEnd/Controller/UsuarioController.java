package com.SenaiCommunity.BackEnd.Controller;

import com.SenaiCommunity.BackEnd.DTO.UsuarioLoginDTO;
import com.SenaiCommunity.BackEnd.DTO.UsuarioLoginResponseDTO;
import com.SenaiCommunity.BackEnd.Service.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/login")
public class UsuarioController {
    @Autowired
    private UsuarioService usuarioService;

    @PostMapping
    public ResponseEntity<UsuarioLoginResponseDTO> login(@RequestBody UsuarioLoginDTO loginDTO) {
        try {
            UsuarioLoginResponseDTO resposta = usuarioService.login(loginDTO);
            return ResponseEntity.ok(resposta);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
