package com.SenaiCommunity.BackEnd.Controller;

import com.SenaiCommunity.BackEnd.DTO.ProfessorDTO;
import com.SenaiCommunity.BackEnd.Entity.Professor;
import com.SenaiCommunity.BackEnd.Entity.Professor;
import com.SenaiCommunity.BackEnd.Service.ProfessorService;
import com.SenaiCommunity.BackEnd.Service.ProfessorService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/professor")
@RequiredArgsConstructor
public class ProfessorController {

    @Autowired
    private ProfessorService professorservice;

    @PostMapping
    public ResponseEntity<ProfessorDTO> created(@RequestBody ProfessorDTO professorDto){
        ProfessorDTO grupos = professorservice.saveDto(professorDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(grupos);
    }

    @GetMapping
    public List<Professor> getAll(@RequestParam(required = false) String nome){

        if(nome != null && !nome.isEmpty()){
            return professorservice.getByNome(nome);
        }else{
            return professorservice.getAll();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProfessorDTO> getById(@PathVariable Long id){
        Optional<ProfessorDTO> professorDTO = professorservice.getById(id);
        if(professorDTO.isPresent()){
            return ResponseEntity.ok(professorDTO.get());
        }else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProfessorDTO> update(@PathVariable Long id, @RequestBody ProfessorDTO professorDTO){
        Optional<ProfessorDTO> professorDTOOptional = professorservice.updateProfessor(id, professorDTO);
        if (professorDTOOptional.isPresent()){
            return ResponseEntity.ok(professorDTOOptional.get());
        }else {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id){
        if(professorservice.delete(id)){
            return ResponseEntity.noContent().build();
        }else {
            return ResponseEntity.notFound().build();
        }
    }
}
