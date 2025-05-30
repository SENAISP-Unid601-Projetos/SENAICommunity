package com.SenaiCommunity.BackEnd.Controller;

import com.SenaiCommunity.BackEnd.Dto.UsuarioCadastroDto;
import com.SenaiCommunity.BackEnd.Service.UsuarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioService usuarioService;

    @PostMapping("/cadastro")
    public ResponseEntity<String> cadastrarUsuario(@RequestBody UsuarioCadastroDto dto) {
        usuarioService.cadastrarUsuario(dto);
        return ResponseEntity.ok("Usuário cadastrado com sucesso!");
    }
}
