package com.SenaiCommunity.BackEnd.Controller;

import com.SenaiCommunity.BackEnd.DTO.*;
import com.SenaiCommunity.BackEnd.Service.AlunoService;
import com.SenaiCommunity.BackEnd.Service.ProfessorService;
import com.SenaiCommunity.BackEnd.Service.SupervisorService; // ✅ Importado
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;


@RestController
@RequestMapping("/cadastro")
public class CadastroUsuarioController {

    @Autowired
    private AlunoService alunoService;

    @Autowired
    private ProfessorService professorService;

    @Autowired
    private SupervisorService supervisorService; // ✅ Injeção do Service

    @PostMapping(path = "/alunos", consumes = "multipart/form-data")
    @Operation(summary = "Cadastra um novo ALUNO")
    public ResponseEntity<AlunoSaidaDTO> cadastrarAluno(
            @RequestParam String nome,
            @RequestParam String email,
            @RequestParam String senha,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataNascimento,
            @RequestParam String curso,
            @RequestParam String periodo,
            @RequestParam(required = false) MultipartFile foto
    ) {
        AlunoEntradaDTO dto = new AlunoEntradaDTO();
        dto.setNome(nome);
        dto.setEmail(email);
        dto.setSenha(senha);
        dto.setCurso(curso);
        dto.setPeriodo(periodo);
        dto.setDataNascimento(dataNascimento);

        return ResponseEntity.ok(alunoService.criarAlunoComFoto(dto, foto));
    }

    @PostMapping(path = "/professores", consumes = "multipart/form-data")
    @Operation(summary = "Cadastra um novo PROFESSOR")
    public ResponseEntity<ProfessorSaidaDTO> criar(
            @RequestParam String nome,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataNascimento,
            @RequestParam String email,
            @RequestParam String senha,
            @RequestParam String formacao,
            @RequestParam String codigoSn,
            @RequestParam(required = false) MultipartFile foto
    ) {
        ProfessorEntradaDTO dto = new ProfessorEntradaDTO();
        dto.setNome(nome);
        dto.setEmail(email);
        dto.setSenha(senha);
        dto.setFormacao(formacao);
        dto.setCodigoSn(codigoSn);
        dto.setDataNascimento(dataNascimento);

        return ResponseEntity.ok(professorService.criarProfessorComFoto(dto, foto));
    }

    // ✅ Endpoint Novo para Supervisor
    @PostMapping(path = "/supervisores", consumes = "multipart/form-data")
    @Operation(summary = "Cadastra um novo SUPERVISOR")
    public ResponseEntity<SupervisorSaidaDTO> cadastrarSupervisor(
            @RequestParam String nome,
            @RequestParam String email,
            @RequestParam String senha,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataNascimento,
            @RequestParam(required = false) MultipartFile foto
    ) {
        SupervisorEntradaDTO dto = new SupervisorEntradaDTO();
        dto.setNome(nome);
        dto.setEmail(email);
        dto.setSenha(senha);
        dto.setDataNascimento(dataNascimento);

        return ResponseEntity.ok(supervisorService.criarSupervisorComFoto(dto, foto));
    }
}