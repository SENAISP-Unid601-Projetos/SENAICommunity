package com.SenaiCommunity.BackEnd.Controller;

import com.SenaiCommunity.BackEnd.DTO.ProjetoDTO;
import com.SenaiCommunity.BackEnd.Entity.ProjetoMembro;
import com.SenaiCommunity.BackEnd.Entity.Usuario;
import com.SenaiCommunity.BackEnd.Repository.UsuarioRepository;
import com.SenaiCommunity.BackEnd.Service.ProjetoService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.core.io.Resource; // Não é mais necessário
// import org.springframework.core.io.UrlResource; // Não é mais necessário
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

// import java.nio.file.Files; // Não é mais necessário
// import java.nio.file.Path; // Não é mais necessário
// import java.nio.file.Paths; // Não é mais necessário
import java.security.Principal;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/projetos")
public class ProjetoController {

    @Autowired
    private ProjetoService projetoService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    // ❌ UPLOAD_DIR E ENDPOINT /imagens REMOVIDOS
    // private static final String UPLOAD_DIR = "uploads/projeto-pictures/";

    @GetMapping
    public ResponseEntity<List<ProjetoDTO>> listarTodos() {
        List<ProjetoDTO> lista = projetoService.listarTodos();
        return ResponseEntity.ok(lista);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjetoDTO> buscarPorId(@PathVariable Long id) {
        try {
            ProjetoDTO dto = projetoService.buscarPorId(id);
            return ResponseEntity.ok(dto);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/meus-projetos")
    public ResponseEntity<List<ProjetoDTO>> listarMeusProjetos(Principal principal) {
        if (principal == null || principal.getName() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        try {
            List<ProjetoDTO> projetos = projetoService.listarMeusProjetos(principal.getName());
            return ResponseEntity.ok(projetos);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(List.of());
        } catch (Exception e) {
            System.err.println("[ERROR] Erro ao listar meus projetos: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> criar(
            @RequestParam String titulo,
            @RequestParam String descricao,
            @RequestParam Integer maxMembros,
            @RequestParam Boolean grupoPrivado,
            @RequestParam Long autorId,
            @RequestParam(required = false) List<Long> professorIds,
            @RequestParam(required = false) List<Long> alunoIds,
            @RequestParam(required = false) List<String> linksUteis,
            @RequestPart(required = false) MultipartFile foto) {
        try {
            ProjetoDTO dto = new ProjetoDTO();
            dto.setTitulo(titulo);
            dto.setDescricao(descricao);
            dto.setMaxMembros(maxMembros);
            dto.setGrupoPrivado(grupoPrivado);
            dto.setAutorId(autorId);
            dto.setProfessorIds(professorIds != null ? professorIds : Collections.emptyList());
            dto.setAlunoIds(alunoIds != null ? alunoIds : Collections.emptyList());
            dto.setLinksUteis(linksUteis != null ? linksUteis : Collections.emptyList());

            ProjetoDTO salvo = projetoService.salvar(dto, foto);
            return ResponseEntity.status(HttpStatus.CREATED).body(salvo);

        } catch (Exception e) {
            System.err.println("[ERROR] Erro ao criar projeto: " + e.getMessage());
            e.printStackTrace();
            // Retorna a mensagem de erro do service (ex: "Upload de vídeos bloqueado")
            return ResponseEntity.badRequest().body(Map.of("message", "Erro ao criar projeto: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> atualizar(
            @PathVariable Long id,
            @RequestBody ProjetoDTO dto,
            Principal principal) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        try {
            Usuario admin = usuarioRepository.findByEmail(principal.getName())
                    .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado"));

            dto.setId(id);
            ProjetoDTO atualizado = projetoService.salvar(dto, null); // Atualiza sem foto
            return ResponseEntity.ok(atualizado);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            System.err.println("[ERROR] Erro ao atualizar projeto " + id + ": " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("message", "Erro ao atualizar projeto: " + e.getMessage()));
        }
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletar(@PathVariable Long id, Principal principal) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        try {
            Usuario admin = usuarioRepository.findByEmail(principal.getName())
                    .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado"));
            projetoService.deletar(id, admin.getId());
            return ResponseEntity.noContent().build();
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            System.err.println("[ERROR] Erro ao deletar projeto " + id + ": " + e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("message", "Erro interno ao deletar projeto."));
        }
    }


    // --- Endpoints de Convite ---
    // (Sem alterações)
    @PostMapping("/{projetoId}/convites")
    public ResponseEntity<?> enviarConvite(
            @PathVariable Long projetoId,
            @RequestParam Long usuarioConvidadoId,
            Principal principal) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        try {
            Usuario convidador = usuarioRepository.findByEmail(principal.getName())
                    .orElseThrow(() -> new EntityNotFoundException("Usuário convidador não encontrado"));
            projetoService.enviarConvite(projetoId, usuarioConvidadoId, convidador.getId());
            return ResponseEntity.ok(Map.of("message", "Convite enviado com sucesso!"));
        } catch (EntityNotFoundException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            System.err.println("[ERROR] Erro ao enviar convite: " + e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("message", "Erro interno ao enviar convite."));
        }
    }

    @PostMapping("/convites/{conviteId}/aceitar")
    public ResponseEntity<?> aceitarConvite(@PathVariable Long conviteId, Principal principal) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        try {
            Usuario usuario = usuarioRepository.findByEmail(principal.getName())
                    .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado"));
            projetoService.aceitarConvite(conviteId, usuario.getId());
            return ResponseEntity.ok(Map.of("message", "Convite aceito com sucesso!"));
        } catch (EntityNotFoundException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            System.err.println("[ERROR] Erro ao aceitar convite: " + e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("message", "Erro interno ao aceitar convite."));
        }
    }

    @DeleteMapping("/convites/{conviteId}/recusar")
    public ResponseEntity<?> recusarOuCancelarConvite(@PathVariable Long conviteId, Principal principal) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        try {
            Usuario usuario = usuarioRepository.findByEmail(principal.getName())
                    .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado"));
            projetoService.recusarConvite(conviteId, usuario.getId());
            return ResponseEntity.ok(Map.of("message", "Ação concluída com sucesso."));
        } catch (EntityNotFoundException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            System.err.println("[ERROR] Erro ao recusar/cancelar convite: " + e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("message", "Erro interno ao processar convite."));
        }
    }

    // --- Endpoints de Membros ---
    // (Sem alterações)
    @DeleteMapping("/{projetoId}/membros/{membroId}")
    public ResponseEntity<?> expulsarMembro(
            @PathVariable Long projetoId,
            @PathVariable Long membroId,
            Principal principal) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        try {
            Usuario admin = usuarioRepository.findByEmail(principal.getName())
                    .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado"));
            projetoService.expulsarMembro(projetoId, membroId, admin.getId());
            return ResponseEntity.ok(Map.of("message", "Membro expulso com sucesso!"));
        } catch (EntityNotFoundException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            System.err.println("[ERROR] Erro ao expulsar membro: " + e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("message", "Erro interno ao expulsar membro."));
        }
    }

    @PutMapping("/{projetoId}/membros/{membroId}/permissao")
    public ResponseEntity<?> alterarPermissao(
            @PathVariable Long projetoId,
            @PathVariable Long membroId,
            @RequestParam String role,
            Principal principal) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        try {
            ProjetoMembro.RoleMembro novaRole;
            try {
                novaRole = ProjetoMembro.RoleMembro.valueOf(role.toUpperCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(Map.of("message", "Role inválida. Use: ADMIN, MODERADOR ou MEMBRO"));
            }
            Usuario admin = usuarioRepository.findByEmail(principal.getName())
                    .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado"));
            projetoService.alterarPermissao(projetoId, membroId, novaRole, admin.getId());
            return ResponseEntity.ok(Map.of("message", "Permissão alterada com sucesso!"));
        } catch (EntityNotFoundException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            System.err.println("[ERROR] Erro ao alterar permissão: " + e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("message", "Erro interno ao alterar permissão."));
        }
    }

    @GetMapping("/participando/contagem/{usuarioId}")
    public ResponseEntity<Long> contarProjetos(@PathVariable Long usuarioId) {
        long count = projetoService.contarProjetosParticipando(usuarioId);
        return ResponseEntity.ok(count);
    }
}