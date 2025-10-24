package com.SenaiCommunity.BackEnd.Controller;

import com.SenaiCommunity.BackEnd.DTO.ProjetoDTO;
import com.SenaiCommunity.BackEnd.Entity.ProjetoMembro;
import com.SenaiCommunity.BackEnd.Service.ProjetoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/projetos")
public class ProjetoController {

    @Autowired
    private ProjetoService projetoService;

    private static final String UPLOAD_DIR = "uploads/projeto-pictures/";

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


    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> criar(
            @RequestParam String titulo,
            @RequestParam String descricao,
            @RequestParam Integer maxMembros,
            @RequestParam Boolean grupoPrivado,
            @RequestParam Long autorId,
<<<<<<< HEAD
            // ADICIONE (required = false) AQUI
            @RequestParam(required = false) List<Long> professorIds,
            // E AQUI
=======

            @RequestParam(required = false) List<Long> professorIds,
>>>>>>> Feature/ChatProjeto
            @RequestParam(required = false) List<Long> alunoIds,
            @RequestPart(required = false) MultipartFile foto) {
        try {
            if (foto != null && !foto.isEmpty()) {
                System.out.println("[DEBUG] Recebendo upload de imagem: " + foto.getOriginalFilename());
                System.out.println("[DEBUG] Content-Type: " + foto.getContentType());
                System.out.println("[DEBUG] Tamanho: " + foto.getSize() + " bytes");
            }

            ProjetoDTO dto = new ProjetoDTO();
            dto.setTitulo(titulo);
            dto.setDescricao(descricao);
            dto.setMaxMembros(maxMembros);
            dto.setGrupoPrivado(grupoPrivado);
            dto.setAutorId(autorId);
            dto.setProfessorIds(professorIds);
            dto.setAlunoIds(alunoIds);

            ProjetoDTO salvo = projetoService.salvar(dto, foto);
            return ResponseEntity.ok(Map.of(
                    "message", "Projeto criado com sucesso! Convites enviados automaticamente para professores e alunos.",
                    "projeto", salvo
            ));
        } catch (IllegalArgumentException e) { // Pega a validação do Service
            return ResponseEntity.badRequest().body("Erro ao criar projeto: " + e.getMessage());
        } catch (Exception e) {
            System.err.println("[ERROR] Erro ao criar projeto: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Erro ao criar projeto: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProjetoDTO> atualizar(@PathVariable Long id, @RequestBody ProjetoDTO dto) {
        dto.setId(id);
        ProjetoDTO atualizado = projetoService.salvar(dto, null);
        return ResponseEntity.ok(atualizado);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        projetoService.deletar(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/convites/recebidos")
    public ResponseEntity<List<Map<String, Object>>> getConvitesRecebidos(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        try {
            List<Map<String, Object>> convites = projetoService.buscarConvitesRecebidos(principal.getName());
            return ResponseEntity.ok(convites);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(null);
        }
    }

    @GetMapping("/convites/enviados")
    public ResponseEntity<List<Map<String, Object>>> getConvitesEnviados(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        try {
            List<Map<String, Object>> convites = projetoService.buscarConvitesEnviados(principal.getName());
            return ResponseEntity.ok(convites);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(null);
        }
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

    @PostMapping("/convites/{conviteId}/recusar")
    public ResponseEntity<?> recusarConvite(
            @PathVariable Long conviteId,
            @RequestParam Long usuarioId) {
        try {
            projetoService.recusarConvite(conviteId, usuarioId);
            return ResponseEntity.ok(Map.of("message", "Convite recusado com sucesso."));
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
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer maxMembros,
            @RequestParam(required = false) Boolean grupoPrivado,
            @RequestParam Long adminId) {
        try {
            projetoService.atualizarInfoGrupo(projetoId, titulo, descricao, imagemUrl, status, maxMembros, grupoPrivado, adminId);
            return ResponseEntity.ok(Map.of("message", "Informações do grupo atualizadas com sucesso!"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Erro interno: " + e.getMessage());
        }
    }

    @DeleteMapping("/{projetoId}/info")
    public ResponseEntity<?> deletarProjeto(
            @PathVariable Long projetoId,
            @RequestParam Long adminId) {
        try {
            projetoService.deletar(projetoId, adminId);
            return ResponseEntity.ok(Map.of("message", "Projeto deletado com sucesso! Todos os membros foram removidos."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Erro interno: " + e.getMessage());
        }
    }

    @GetMapping("/imagens/{filename:.+}")
    public ResponseEntity<Resource> servirImagem(@PathVariable String filename) {
        try {
            Path filePath = Paths.get(UPLOAD_DIR).resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                // Determinar content type baseado na extensão
                String contentType = "image/jpeg"; // default
                String fileName = filename.toLowerCase();
                if (fileName.endsWith(".png")) {
                    contentType = "image/png";
                } else if (fileName.endsWith(".gif")) {
                    contentType = "image/gif";
                } else if (fileName.endsWith(".webp")) {
                    contentType = "image/webp";
                }

                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            System.err.println("[ERROR] Erro ao servir imagem: " + e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
}