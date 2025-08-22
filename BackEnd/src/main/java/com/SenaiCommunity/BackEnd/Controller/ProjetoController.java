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
    public ResponseEntity<?> criar(
            @RequestParam String titulo,
            @RequestParam String descricao,
            @RequestParam String imagemUrl,
            @RequestParam Integer maxMembros,
            @RequestParam Boolean grupoPrivado,
            @RequestParam Long autorId,
            @RequestParam String autorNome,
            @RequestParam List<Long> professorIds,
            @RequestParam List<Long> alunoIds) {
        try {
            ProjetoDTO dto = new ProjetoDTO();
            dto.setTitulo(titulo);
            dto.setDescricao(descricao);
            dto.setImagemUrl(imagemUrl);
            dto.setMaxMembros(maxMembros);
            dto.setGrupoPrivado(grupoPrivado);
            dto.setAutorId(autorId);
            dto.setAutorNome(autorNome);
            dto.setProfessorIds(professorIds);
            dto.setAlunoIds(alunoIds);

            ProjetoDTO salvo = projetoService.salvar(dto);
            return ResponseEntity.ok(Map.of(
                    "message", "Projeto criado com sucesso!",
                    "projeto", salvo
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erro ao criar projeto: " + e.getMessage());
        }
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
            @RequestParam Long usuarioConvidadoId,
            @RequestParam Long usuarioConvidadorId) {
        try {
            if (usuarioConvidadoId <= 0 || usuarioConvidadorId <= 0) {
                return ResponseEntity.badRequest().body("IDs devem ser números positivos");
            }

            projetoService.enviarConvite(projetoId, usuarioConvidadoId, usuarioConvidadorId);
            return ResponseEntity.ok(Map.of("message", "Convite enviado com sucesso!"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Erro interno: " + e.getMessage());
        }
    }

    @PostMapping("/convites/{conviteId}/aceitar")
    public ResponseEntity<?> aceitarConvite(
            @PathVariable Long conviteId,
            @RequestParam Long usuarioId) {
        try {
            projetoService.aceitarConvite(conviteId, usuarioId);
            return ResponseEntity.ok(Map.of("message", "Convite aceito com sucesso! Você agora faz parte do grupo."));
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
            return ResponseEntity.ok(Map.of("message", "Membro expulso do grupo com sucesso!"));
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
            @RequestParam String role,
            @RequestParam Long adminId) {
        try {
            ProjetoMembro.RoleMembro novaRole;
            try {
                novaRole = ProjetoMembro.RoleMembro.valueOf(role.toUpperCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body("Role inválida. Use: ADMIN, MODERADOR ou MEMBRO");
            }

            projetoService.alterarPermissao(projetoId, membroId, novaRole, adminId);
            return ResponseEntity.ok(Map.of("message", "Permissão alterada com sucesso!"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Erro interno: " + e.getMessage());
        }
    }

    @PutMapping("/{projetoId}/info")
    public ResponseEntity<?> atualizarInfoGrupo(
            @PathVariable Long projetoId,
            @RequestParam(required = false) String titulo,
            @RequestParam(required = false) String descricao,
            @RequestParam(required = false) String imagemUrl,
            @RequestParam Long adminId) {
        try {
            projetoService.atualizarInfoGrupo(projetoId, titulo, descricao, imagemUrl, adminId);
            return ResponseEntity.ok(Map.of("message", "Informações do grupo atualizadas com sucesso!"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Erro interno: " + e.getMessage());
        }
    }
}
