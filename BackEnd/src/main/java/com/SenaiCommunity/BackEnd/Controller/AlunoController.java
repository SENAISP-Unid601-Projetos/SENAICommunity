package com.SenaiCommunity.BackEnd.Controller;

import com.SenaiCommunity.BackEnd.DTO.AlunoEntradaDTO;
import com.SenaiCommunity.BackEnd.DTO.AlunoSaidaDTO;
import com.SenaiCommunity.BackEnd.Service.AlunoService;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
@PreAuthorize("hasRole('ADMIN')")
@RestController
@RequestMapping("/alunos")
public class AlunoController {

    @Autowired
    private AlunoService alunoService;

    @PostMapping(consumes = "multipart/form-data")
    @Operation(summary = "Cadastra um novo ALUNO")
    public ResponseEntity<AlunoSaidaDTO> cadastrarAluno(
            @RequestParam String nome,
            @RequestParam String email,
            @RequestParam String senha,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataNascimento,
            @RequestParam String curso,
            @RequestParam String periodo,
            @RequestParam(required = false) String bio,
            @RequestParam(required = false) MultipartFile foto // opcional
    ) {
        AlunoEntradaDTO dto = new AlunoEntradaDTO();
        dto.setNome(nome);
        dto.setEmail(email);
        dto.setSenha(senha);
        dto.setCurso(curso);
        dto.setPeriodo(periodo);
        dto.setDataNascimento(dataNascimento);
        dto.setBio(bio);

        return ResponseEntity.ok(alunoService.criarAlunoComFoto(dto, foto));
    }


    @GetMapping
    public ResponseEntity<List<AlunoSaidaDTO>> listarTodos() {
        return ResponseEntity.ok(alunoService.listarTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AlunoSaidaDTO> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(alunoService.buscarPorId(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AlunoSaidaDTO> atualizarAluno(@PathVariable Long id, @RequestBody AlunoEntradaDTO dto) {
        return ResponseEntity.ok(alunoService.atualizarAluno(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarAluno(@PathVariable Long id) {
        alunoService.deletarAluno(id);
        return ResponseEntity.noContent().build();
    }
}
