package com.SenaiCommunity.BackEnd.Controller;

import com.SenaiCommunity.BackEnd.DTO.UsuarioAtualizacaoDTO;
import com.SenaiCommunity.BackEnd.DTO.UsuarioBuscaDTO;
import com.SenaiCommunity.BackEnd.DTO.UsuarioSaidaDTO;
import com.SenaiCommunity.BackEnd.Service.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.core.Authentication;

import java.io.IOException;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/usuarios")
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ALUNO') or hasRole('PROFESSOR')")
public class UsuarioController {

    @Autowired
    private UsuarioService usuarioService;

    @GetMapping("/me")
    public ResponseEntity<UsuarioSaidaDTO> getMeuUsuario(Authentication authentication) {
        UsuarioSaidaDTO usuarioDTO = usuarioService.buscarUsuarioLogado(authentication);
        return ResponseEntity.ok(usuarioDTO);
    }

    @PutMapping("/me")
    public ResponseEntity<UsuarioSaidaDTO> atualizarMeuUsuario(@RequestBody UsuarioAtualizacaoDTO dto, Authentication authentication) {
        UsuarioSaidaDTO usuarioAtualizadoDTO = usuarioService.atualizarUsuarioLogado(authentication, dto);
        return ResponseEntity.ok(usuarioAtualizadoDTO);
    }

    @DeleteMapping("/me")
    public ResponseEntity<Void> deletarMinhaConta(Authentication authentication) {
        usuarioService.deletarUsuarioLogado(authentication);
        return ResponseEntity.noContent().build();
    }

    // NOVO ENDPOINT PARA A FOTO
    @PutMapping("/me/foto")
    public ResponseEntity<UsuarioSaidaDTO> atualizarMinhaFoto(@RequestPart("foto") MultipartFile foto, Authentication authentication) throws IOException {
        UsuarioSaidaDTO usuarioAtualizado = usuarioService.atualizarFotoPerfil(authentication, foto);
        return ResponseEntity.ok(usuarioAtualizado);
    }

    @GetMapping("/buscar")
    public ResponseEntity<List<UsuarioBuscaDTO>> buscarUsuarios(@RequestParam("nome") String nome, Principal principal) {
        List<UsuarioBuscaDTO> usuarios = usuarioService.buscarUsuariosPorNome(nome, principal.getName());
        return ResponseEntity.ok(usuarios);
    }
}
