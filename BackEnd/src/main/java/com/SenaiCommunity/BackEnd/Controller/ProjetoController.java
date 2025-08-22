package com.SenaiCommunity.BackEnd.Controller;

import com.SenaiCommunity.BackEnd.DTO.ProjetoDTO;
import com.SenaiCommunity.BackEnd.Entity.ProjetoMembro;
import com.SenaiCommunity.BackEnd.Service.ProjetoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/projetos")
public class ProjetoController {

    @Autowired
    private ProjetoService projetoService;

    @GetMapping
    public ResponseEntity<List<ProjetoDTO>> listarTodos() {
        List<ProjetoDTO> lista = projetoService.listarTodos();
        return ResponseEntity.ok(lista);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjetoDTO> buscarPorId(@PathVariable Long id) {
        ProjetoDTO dto = projetoService.buscarPorId(id);
        return ResponseEntity.ok(dto);
    }

    @PostMapping
    public ResponseEntity<ProjetoDTO> criar(@RequestBody ProjetoDTO dto) {
        ProjetoDTO salvo = projetoService.salvar(dto);
        return ResponseEntity.ok(salvo);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProjetoDTO> atualizar(@PathVariable Long id, @RequestBody ProjetoDTO dto) {
        dto.setId(id);
        ProjetoDTO atualizado = projetoService.salvar(dto);
        return ResponseEntity.ok(atualizado);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        projetoService.deletar(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{projetoId}/convites")
    public ResponseEntity<?> enviarConvite(
            @PathVariable Long projetoId,
            @RequestBody Map<String, Object> request) {
        try {
            Object usuarioConvidadoIdObj = request.get("usuarioConvidadoId");
            Object usuarioConvidadorIdObj = request.get("usuarioConvidadorId");

            if (usuarioConvidadoIdObj == null || usuarioConvidadorIdObj == null ||
                    usuarioConvidadoIdObj.toString().trim().isEmpty() ||
                    usuarioConvidadorIdObj.toString().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("usuarioConvidadoId e usuarioConvidadorId são obrigatórios e não podem estar vazios");
            }

            Long usuarioConvidadoId = Long.valueOf(usuarioConvidadoIdObj.toString().trim());
            Long usuarioConvidadorId = Long.valueOf(usuarioConvidadorIdObj.toString().trim());

            if (usuarioConvidadoId <= 0 || usuarioConvidadorId <= 0) {
                return ResponseEntity.badRequest().body("IDs devem ser números positivos");
            }

            projetoService.enviarConvite(projetoId, usuarioConvidadoId, usuarioConvidadorId);
            return ResponseEntity.ok().build();
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body("IDs devem ser números válidos");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Erro interno: " + e.getMessage());
        }
    }

    @PostMapping("/convites/{conviteId}/aceitar")
    public ResponseEntity<?> aceitarConvite(
            @PathVariable Long conviteId,
            @RequestBody Map<String, Object> request) {
        try {
            Object usuarioIdObj = request.get("usuarioId");

            if (usuarioIdObj == null) {
                return ResponseEntity.badRequest().body("usuarioId é obrigatório");
            }

            Long usuarioId = Long.valueOf(usuarioIdObj.toString().trim());

            projetoService.aceitarConvite(conviteId, usuarioId);
            return ResponseEntity.ok().build();
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body("usuarioId deve ser um número válido");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Erro interno: " + e.getMessage());
        }
    }

    @DeleteMapping("/{projetoId}/membros/{membroId}")
    public ResponseEntity<?> expulsarMembro(
            @PathVariable Long projetoId,
            @PathVariable Long membroId,
            @RequestParam Long adminId) {
        try {
            projetoService.expulsarMembro(projetoId, membroId, adminId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Erro interno: " + e.getMessage());
        }
    }

    @PutMapping("/{projetoId}/membros/{membroId}/permissao")
    public ResponseEntity<?> alterarPermissao(
            @PathVariable Long projetoId,
            @PathVariable Long membroId,
            @RequestBody Map<String, Object> request) {
        try {
            Object roleObj = request.get("role");
            Object adminIdObj = request.get("adminId");

            if (roleObj == null || adminIdObj == null) {
                return ResponseEntity.badRequest().body("role e adminId são obrigatórios");
            }

            String roleStr = roleObj.toString().trim();
            Long adminId = Long.valueOf(adminIdObj.toString().trim());

            ProjetoMembro.RoleMembro novaRole;
            try {
                novaRole = ProjetoMembro.RoleMembro.valueOf(roleStr.toUpperCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body("Role inválida. Use: ADMIN, MODERADOR ou MEMBRO");
            }

            projetoService.alterarPermissao(projetoId, membroId, novaRole, adminId);
            return ResponseEntity.ok().build();
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body("adminId deve ser um número válido");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Erro interno: " + e.getMessage());
        }
    }

    @PutMapping("/{projetoId}/info")
    public ResponseEntity<?> atualizarInfoGrupo(
            @PathVariable Long projetoId,
            @RequestBody Map<String, Object> request) {
        try {
            String novoTitulo = (String) request.get("titulo");
            String novaDescricao = (String) request.get("descricao");
            String novaImagemUrl = (String) request.get("imagemUrl");
            Object adminIdObj = request.get("adminId");

            if (adminIdObj == null) {
                return ResponseEntity.badRequest().body("adminId é obrigatório");
            }

            Long adminId = Long.valueOf(adminIdObj.toString().trim());

            projetoService.atualizarInfoGrupo(projetoId, novoTitulo, novaDescricao, novaImagemUrl, adminId);
            return ResponseEntity.ok().build();
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body("adminId deve ser um número válido");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Erro interno: " + e.getMessage());
        }
    }
}
