package com.SenaiCommunity.BackEnd.Controller;

import com.SenaiCommunity.BackEnd.DTO.UsuarioAtualizacaoDTO;
import com.SenaiCommunity.BackEnd.DTO.UsuarioBuscaDTO;
import com.SenaiCommunity.BackEnd.DTO.UsuarioSaidaDTO;
import com.SenaiCommunity.BackEnd.Repository.UsuarioRepository;
import com.SenaiCommunity.BackEnd.Service.MensagemPrivadaService;
import com.SenaiCommunity.BackEnd.Service.UserStatusService;
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
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/usuarios")
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ALUNO') or hasRole('PROFESSOR') or hasRole('ADMIN')")
public class UsuarioController {

    @Autowired
    private UsuarioService usuarioService;

    @Autowired
    private UserStatusService userStatusService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private MensagemPrivadaService mensagemPrivadaService;

    @GetMapping("/me")
    public ResponseEntity<UsuarioSaidaDTO> getMeuUsuario(Authentication authentication) {
        UsuarioSaidaDTO usuarioDTO = usuarioService.buscarUsuarioLogado(authentication);
        return ResponseEntity.ok(usuarioDTO);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UsuarioSaidaDTO> buscarUsuarioPorId(@PathVariable Long id) {
        UsuarioSaidaDTO usuario = usuarioService.buscarUsuarioPorId(id);
        return ResponseEntity.ok(usuario);
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

    @PutMapping("/me/foto")
    public ResponseEntity<UsuarioSaidaDTO> atualizarMinhaFoto(@RequestPart("foto") MultipartFile foto, Authentication authentication) throws IOException {
        UsuarioSaidaDTO usuarioAtualizado = usuarioService.atualizarFotoPerfil(authentication, foto);
        return ResponseEntity.ok(usuarioAtualizado);
    }

    @PutMapping("/me/fundo")
    public ResponseEntity<UsuarioSaidaDTO> atualizarMinhaFotoFundo(
            @RequestPart("file") MultipartFile foto, // O parâmetro no Form-Data será 'file'
            Authentication authentication) throws IOException {

        UsuarioSaidaDTO usuarioAtualizado = usuarioService.atualizarFotoFundo(authentication, foto);
        return ResponseEntity.ok(usuarioAtualizado);
    }

    @GetMapping("/buscar")
    public ResponseEntity<List<UsuarioBuscaDTO>> buscarUsuarios(
            @RequestParam(value = "nome", required = false, defaultValue = "") String nome,
            Principal principal) {

        List<UsuarioBuscaDTO> usuarios = usuarioService.buscarUsuariosPorNome(nome, principal.getName());
        return ResponseEntity.ok(usuarios);
    }

    @GetMapping("/online")
    public ResponseEntity<Set<String>> getOnlineUsers() {
        return ResponseEntity.ok(userStatusService.getOnlineUsers());
    }

    @PostMapping("/bloquear/{id}")
    public ResponseEntity<?> bloquearUsuario(@PathVariable Long id, Principal principal) {
        try {
            mensagemPrivadaService.bloquearUsuario(principal.getName(), id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Desbloquear Usuário
    @DeleteMapping("/bloquear/{id}")
    public ResponseEntity<?> desbloquearUsuario(@PathVariable Long id, Principal principal) {
        try {
            mensagemPrivadaService.desbloquearUsuario(principal.getName(), id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Listar Bloqueados (Para o Modal)
    @GetMapping("/bloqueados")
    public ResponseEntity<List<UsuarioSaidaDTO>> listarBloqueados(Principal principal) {
        List<UsuarioSaidaDTO> bloqueados = mensagemPrivadaService.listarBloqueados(principal.getName());
        return ResponseEntity.ok(bloqueados);
    }



    @GetMapping("/status-bloqueio/{id}")
    public ResponseEntity<?> verificarStatusBloqueio(@PathVariable Long id, Principal principal) {
        boolean euBloqueei = mensagemPrivadaService.verificarBloqueio(principal.getName(), id);
        boolean fuiBloqueado = mensagemPrivadaService.fuiBloqueado(principal.getName(), id);
        return ResponseEntity.ok(Map.of("euBloqueei", euBloqueei, "fuiBloqueado", fuiBloqueado));
    }
}