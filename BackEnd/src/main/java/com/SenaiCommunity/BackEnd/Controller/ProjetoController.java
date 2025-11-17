package com.SenaiCommunity.BackEnd.Controller;

import com.SenaiCommunity.BackEnd.DTO.ProjetoDTO;
import com.SenaiCommunity.BackEnd.Entity.ProjetoMembro;
import com.SenaiCommunity.BackEnd.Exception.ConteudoImproprioException;
import com.SenaiCommunity.BackEnd.Service.ArquivoMidiaService;
import com.SenaiCommunity.BackEnd.Service.ProjetoService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/projetos")
public class ProjetoController {

    @Autowired
    private ProjetoService projetoService;

    @Autowired
    private ArquivoMidiaService midiaService;


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

    @GetMapping("/publicos")
    public ResponseEntity<List<ProjetoDTO>> listarProjetosPublicos() {
        List<ProjetoDTO> lista = projetoService.listarProjetosPublicos();
        return ResponseEntity.ok(lista);
    }

    @PostMapping("/{projetoId}/entrar")
    public ResponseEntity<?> entrarEmProjetoPublico(
            @PathVariable Long projetoId,
            @RequestParam Long usuarioId) {
        try {
            projetoService.entrarEmProjetoPublico(projetoId, usuarioId);
            return ResponseEntity.ok(Map.of("message", "Você entrou no projeto com sucesso!"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Erro interno: " + e.getMessage());
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
            @RequestPart(required = false) MultipartFile foto,
            @RequestParam(required = false) String categoria,
            @RequestParam(required = false) List<String> tecnologias) {

        try {
            // Validações básicas
            if (titulo == null || titulo.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Título é obrigatório");
            }

            ProjetoDTO dto = new ProjetoDTO();
            dto.setTitulo(titulo.trim());
            dto.setDescricao(descricao != null ? descricao.trim() : "");
            dto.setMaxMembros(maxMembros != null ? maxMembros : 10);
            dto.setGrupoPrivado(grupoPrivado != null ? grupoPrivado : false);
            dto.setAutorId(autorId);
            dto.setProfessorIds(professorIds);
            dto.setAlunoIds(alunoIds);
            dto.setCategoria(categoria);
            dto.setTecnologias(tecnologias);

            ProjetoDTO salvo = projetoService.salvar(dto, foto);

            return ResponseEntity.ok(Map.of(
                    "message", "Projeto criado com sucesso!",
                    "projeto", salvo
            ));

        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Erro ao criar projeto: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProjetoDTO> atualizar(@PathVariable Long id, @RequestBody ProjetoDTO dto) {
        dto.setId(id);
        // Esta chamada passa 'null' para a foto, o que é correto para
        // uma atualização que não altera a imagem.
        ProjetoDTO atualizado = projetoService.salvar(dto, null);
        return ResponseEntity.ok(atualizado);
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

    @GetMapping("/{projetoId}/membros")
    public ResponseEntity<List<ProjetoDTO.MembroDTO>> getMembrosProjeto(@PathVariable Long projetoId) {
        try {
            ProjetoDTO projetoDTO = projetoService.buscarPorId(projetoId);
            return ResponseEntity.ok(projetoDTO.getMembros());
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
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

    @PutMapping(value = "/{projetoId}/info", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> atualizarInfoGrupo(
            @PathVariable Long projetoId,
            @RequestParam(required = false) String titulo,
            @RequestParam(required = false) String descricao,
            @RequestParam(required = false) MultipartFile foto, // CORREÇÃO: Aceitar arquivo
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer maxMembros,
            @RequestParam(required = false) Boolean grupoPrivado,
            @RequestParam(required = false) String categoria,
            @RequestParam(required = false) String tecnologias, // CORREÇÃO: Aceitar tecnologias como JSON string
            @RequestParam Long adminId) {

        try {
            // CORREÇÃO: Processar tecnologias se fornecidas
            List<String> tecnologiasList = null;
            if (tecnologias != null && !tecnologias.trim().isEmpty()) {
                try {
                    tecnologiasList = new ObjectMapper().readValue(tecnologias, new TypeReference<List<String>>() {});
                } catch (Exception e) {
                    // Fallback: tentar como lista separada por vírgulas
                    tecnologiasList = Arrays.stream(tecnologias.split(","))
                            .map(String::trim)
                            .filter(s -> !s.isEmpty())
                            .collect(Collectors.toList());
                }
            }

            // CORREÇÃO: Se uma foto foi enviada, fazer upload e obter URL
            String novaImagemUrl = null;
            if (foto != null && !foto.isEmpty()) {
                try {
                    novaImagemUrl = midiaService.upload(foto);
                } catch (IOException e) {
                    return ResponseEntity.badRequest().body("Erro ao fazer upload da foto: " + e.getMessage());
                }
            }

            projetoService.atualizarInfoGrupo(projetoId, titulo, descricao, novaImagemUrl,
                    status, maxMembros, grupoPrivado, categoria,
                    tecnologiasList, adminId);
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

}
