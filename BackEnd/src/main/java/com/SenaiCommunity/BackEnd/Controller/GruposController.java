package com.SenaiCommunity.BackEnd.Controller;

import com.SenaiCommunity.BackEnd.DTO.GruposDTO;
import com.SenaiCommunity.BackEnd.Entity.Grupos;
import com.SenaiCommunity.BackEnd.Service.GruposService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@Controller
@RequestMapping("/grupos")
public class GruposController {
    @Autowired
    private GruposService gruposService;

    @PostMapping
    public ResponseEntity<GruposDTO> created(@RequestBody GruposDTO gruposDto){
        GruposDTO grupos = gruposService.saveDto(gruposDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(grupos);
    }

    @GetMapping
    public List<Grupos> getAll(@RequestParam(required = false) String nome){

        if(nome != null && !nome.isEmpty()){
            return gruposService.getByNome(nome);
        }else{
            return gruposService.getAll();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<GruposDTO> getById(@PathVariable Long id){
        Optional<GruposDTO> gruposDTO = gruposService.getById(id);
        if(gruposDTO.isPresent()){
            return ResponseEntity.ok(gruposDTO.get());
        }else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<GruposDTO> update(@PathVariable Long id, @RequestBody GruposDTO gruposDTO){
        Optional<GruposDTO> gruposDTOOptional = gruposService.updateGrupos(id, gruposDTO);
        if (gruposDTOOptional.isPresent()){
            return ResponseEntity.ok(gruposDTOOptional.get());
        }else {
            return ResponseEntity.notFound().build();
        }
    }
    @PutMapping("/{id}/participacao-add/{idParticipcao}")
    public ResponseEntity<String> addParticipacaoTurma(@PathVariable Long id, @PathVariable Long idAluno){
        if(gruposService.addParticipacaoGrupo(id, idAluno)){
            return ResponseEntity.ok("Aluno adicionado com sucesso");
        }else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Aluno não encontrado");
        }
    }

    @PutMapping("/{id}/participacao-remove/{idAluno}")
    public ResponseEntity<String> removerParticipcaoGrupo(@PathVariable Long id, @PathVariable Long idAluno){
        if(gruposService.removerParticipacaoGrupo(id, idAluno)){
            return ResponseEntity.ok("Aluno removido do grupo com sucesso");
        }else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Erro ao remover aluno do grupo");
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id){
        if(gruposService.delete(id)){
            return ResponseEntity.noContent().build();
        }else {
            return ResponseEntity.notFound().build();
        }
    }
}
