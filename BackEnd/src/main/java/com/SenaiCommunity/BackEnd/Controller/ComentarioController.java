package com.SenaiCommunity.BackEnd.Controller;

import com.SenaiCommunity.BackEnd.Dto.ComentarioDto;
import com.SenaiCommunity.BackEnd.Entity.Comentario;
import com.SenaiCommunity.BackEnd.Entity.Grupos;
import com.SenaiCommunity.BackEnd.Service.ComentarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Controller
public class ComentarioController {
    @Autowired
    private ComentarioService comentarioservice;

    @PostMapping
    public ResponseEntity<ComentarioDto> created(@RequestBody ComentarioDto comentarioDto){
        ComentarioDto comentario = comentarioservice.saveDto(comentarioDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(comentario);
    }

    @GetMapping
    public List<Comentario> getAll(@RequestParam(required = false) LocalDateTime dataComentario){

        if(dataComentario != null){
            return comentarioservice.getByData(dataComentario);
        }else{
            return comentarioservice.getAll();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ComentarioDto> getById(@PathVariable Long id){
        Optional<ComentarioDto> comentarioDTO = comentarioservice.getById(id);
        if(comentarioDTO.isPresent()){
            return ResponseEntity.ok(comentarioDTO.get());
        }else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ComentarioDto> update(@PathVariable Long id, @RequestBody ComentarioDto comentarioDTO){
        Optional<ComentarioDto> comentarioDTOOptional = comentarioservice.updateComentario(id, comentarioDTO);
        if (comentarioDTOOptional.isPresent()){
            return ResponseEntity.ok(comentarioDTOOptional.get());
        }else {
            return ResponseEntity.notFound().build();
        }
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id){
        if(comentarioservice.delete(id)){
            return ResponseEntity.noContent().build();
        }else {
            return ResponseEntity.notFound().build();
        }
    }
}
