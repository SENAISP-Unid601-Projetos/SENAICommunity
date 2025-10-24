package com.SenaiCommunity.BackEnd.Controller;

import com.SenaiCommunity.BackEnd.DTO.ProjetoDTO;
import com.SenaiCommunity.BackEnd.Entity.ProjetoMembro;
import com.SenaiCommunity.BackEnd.Entity.Usuario; // ✅ Importar Usuario
import com.SenaiCommunity.BackEnd.Repository.UsuarioRepository; // ✅ Importar UsuarioRepository
import com.SenaiCommunity.BackEnd.Service.ProjetoService;
import jakarta.persistence.EntityNotFoundException; // ✅ Importar EntityNotFoundException
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.Principal; // ✅ Importar Principal
import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/projetos")
public class ProjetoController {

    @Autowired
    private ProjetoService projetoService;

    // ✅ Injetar UsuarioRepository para buscar o usuário logado
    @Autowired
    private UsuarioRepository usuarioRepository;

    private static final String UPLOAD_DIR = "uploads/projeto-pictures/";

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
        } catch (EntityNotFoundException e) { // Trata se não encontrar
            return ResponseEntity.notFound().build();
        }
    }

    // ✅ --- NOVO MÉTODO ADICIONADO ---
    // Endpoint para buscar apenas os projetos do usuário logado
    @GetMapping("/meus-projetos")
    public ResponseEntity<List<ProjetoDTO>> listarMeusProjetos(Principal principal) {
        // Verifica se o usuário está autenticado (Spring Security preenche Principal)
        if (principal == null || principal.getName() == null) {
            // Retorna não autorizado se não houver usuário logado
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        try {
            // Chama o serviço passando o email (username) do usuário logado
            List<ProjetoDTO> projetos = projetoService.listarMeusProjetos(principal.getName());
            return ResponseEntity.ok(projetos);
        } catch (EntityNotFoundException e) {
            // Caso o usuário do token não seja encontrado no banco (raro)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(List.of());
        } catch (Exception e) {
            // Outros erros inesperados
            System.err.println("[ERROR] Erro ao listar meus projetos: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
    // --- FIM DO NOVO MÉTODO ---

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> criar(
            @RequestParam String titulo,
            @RequestParam String descricao,
            @RequestParam Integer maxMembros,
            @RequestParam Boolean grupoPrivado,
            @RequestParam Long autorId,
            @RequestParam(required = false) List<Long> professorIds,
            @RequestParam(required = false) List<Long> alunoIds,
            @RequestParam(required = false) List<String> linksUteis, // Campo de links
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
            dto.setLinksUteis(linksUteis != null ? linksUteis : Collections.emptyList()); // Passa os links

            ProjetoDTO salvo = projetoService.salvar(dto, foto);
            return ResponseEntity.status(HttpStatus.CREATED).body(salvo);

        } catch (Exception e) {
            System.err.println("[ERROR] Erro ao criar projeto: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("message", "Erro ao criar projeto: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> atualizar(
            @PathVariable Long id,
            @RequestBody ProjetoDTO dto, // Assume que a atualização envia JSON
            Principal principal) { // Pega usuário logado
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        try {
            // Verifica permissão
            Usuario admin = usuarioRepository.findByEmail(principal.getName())
                    .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado"));

            // Delega a verificação de permissão para o service
            // if (!projetoService.isAdmin(id, admin.getId())) {
            //     return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Apenas admins podem atualizar o projeto."));
            // }

            dto.setId(id); // Garante que o ID está correto
            // Chama o salvar sem foto, pois a foto seria atualizada em outro endpoint
            ProjetoDTO atualizado = projetoService.salvar(dto, null);
            return ResponseEntity.ok(atualizado);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalArgumentException e) { // Captura erros de permissão do service
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            System.err.println("[ERROR] Erro ao atualizar projeto " + id + ": " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("message", "Erro ao atualizar projeto: " + e.getMessage()));
        }
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletar(@PathVariable Long id, Principal principal) { // Pega usuário logado
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        try {
            Usuario admin = usuarioRepository.findByEmail(principal.getName())
                    .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado"));
            projetoService.deletar(id, admin.getId()); // Usa o método com verificação de admin
            return ResponseEntity.noContent().build();
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (IllegalArgumentException e) { // Captura erro de permissão do service
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            System.err.println("[ERROR] Erro ao deletar projeto " + id + ": " + e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("message", "Erro interno ao deletar projeto."));
        }
    }


    // --- Endpoints de Convite ---
    @PostMapping("/{projetoId}/convites")
    public ResponseEntity<?> enviarConvite(
            @PathVariable Long projetoId,
            @RequestParam Long usuarioConvidadoId,
            Principal principal) { // Usa Principal para pegar quem está convidando
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

    // Usa DELETE para recusar/cancelar
    @DeleteMapping("/convites/{conviteId}/recusar")
    public ResponseEntity<?> recusarOuCancelarConvite(@PathVariable Long conviteId, Principal principal) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        try {
            Usuario usuario = usuarioRepository.findByEmail(principal.getName())
                    .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado"));
            projetoService.recusarConvite(conviteId, usuario.getId()); // Service decide se recusa ou cancela
            return ResponseEntity.ok(Map.of("message", "Ação concluída com sucesso.")); // Mensagem genérica
        } catch (EntityNotFoundException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            System.err.println("[ERROR] Erro ao recusar/cancelar convite: " + e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("message", "Erro interno ao processar convite."));
        }
    }

    // --- Endpoints de Membros ---
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
            @RequestParam String role, // Recebe "ADMIN", "MODERADOR" ou "MEMBRO"
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

    // (O resto dos métodos como atualizarInfoGrupo, deletarProjeto, servirImagem permanecem iguais)

    @GetMapping("/imagens/{filename:.+}")
    public ResponseEntity<Resource> servirImagem(@PathVariable String filename) {
        try {
            Path filePath = Paths.get(UPLOAD_DIR).resolve(filename).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                String contentType = Files.probeContentType(filePath);
                if (contentType == null) {
                    contentType = "application/octet-stream";
                }
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                System.err.println("[WARN] Imagem não encontrada ou ilegível: " + filename);
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            System.err.println("[ERROR] Erro ao servir imagem '" + filename + "': " + e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
}