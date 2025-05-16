package com.SenaiCommunity.BackEnd.Controller;

import com.SenaiCommunity.BackEnd.Dto.ChatPrivadoDto;
import com.SenaiCommunity.BackEnd.Entity.ChatPrivado;
import com.SenaiCommunity.BackEnd.Service.ChatPrivadoService;
import com.SenaiCommunity.BackEnd.Service.ChatPrivadoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@Controller
@RequestMapping("/chatprivado")
public class ChatPrivadoController {
    @Autowired
    private ChatPrivadoService chatprivadoservice;

    @PostMapping
    public ResponseEntity<ChatPrivadoDto> created(@RequestBody ChatPrivadoDto chatprivadoDto){
        ChatPrivadoDto chatprivado = chatprivadoservice.saveDto(chatprivadoDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(chatprivado);
    }

    @GetMapping
    public List<ChatPrivado> getAll(){
            return chatprivadoservice.getAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<ChatPrivadoDto> getById(@PathVariable Long id){
        Optional<ChatPrivadoDto> chatprivadoDTO = chatprivadoservice.getById(id);
        if(chatprivadoDTO.isPresent()){
            return ResponseEntity.ok(chatprivadoDTO.get());
        }else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id){
        if(chatprivadoservice.delete(id)){
            return ResponseEntity.noContent().build();
        }else {
            return ResponseEntity.notFound().build();
        }
    }
}
