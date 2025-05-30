package com.SenaiCommunity.BackEnd.Controller;

import com.SenaiCommunity.BackEnd.DTO.ProfessorEntradaDTO;
import com.SenaiCommunity.BackEnd.DTO.ProfessorSaidaDTO;
import com.SenaiCommunity.BackEnd.Service.ProfessorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/professores")
public class ProfessorController {

    @Autowired
    private ProfessorService professorService;

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<ProfessorSaidaDTO> criar(
            @RequestParam String nome,
            @RequestParam String email,
            @RequestParam String senha,
            @RequestParam String formacao,
            @RequestParam String areaAtuacao,
            @RequestParam String codigoSn,
            @RequestParam(required = false) MultipartFile foto
    ) {
        ProfessorEntradaDTO dto = new ProfessorEntradaDTO();
        dto.setNome(nome);
        dto.setEmail(email);
        dto.setSenha(senha);
        dto.setFormacao(formacao);
        dto.setAreaAtuacao(areaAtuacao);
        dto.setCodigoSn(codigoSn);

        return ResponseEntity.ok(professorService.criarProfessorComFoto(dto, foto));
    }

    @GetMapping
    public ResponseEntity<List<ProfessorSaidaDTO>> listar() {
        return ResponseEntity.ok(professorService.listarTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProfessorSaidaDTO> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(professorService.buscarPorId(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProfessorSaidaDTO> atualizar(@PathVariable Long id,
                                                       @RequestBody ProfessorEntradaDTO dto) {
        return ResponseEntity.ok(professorService.atualizarProfessor(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        professorService.deletarProfessor(id);
        return ResponseEntity.noContent().build();
    }
}
