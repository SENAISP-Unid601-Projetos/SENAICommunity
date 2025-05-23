package com.SenaiCommunity.BackEnd.Service;

import com.SenaiCommunity.BackEnd.DTO.ChatPrivadoDTO;
import com.SenaiCommunity.BackEnd.Entity.ChatPrivado;
import com.SenaiCommunity.BackEnd.Repository.ChatPrivadoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ChatPrivadoService {
    @Autowired
    private ChatPrivadoRepository chatprivadorepository;

    public ChatPrivado fromDTO(ChatPrivadoDTO chatprivadoDto){
        ChatPrivado chatprivado = new ChatPrivado();
        chatprivado.setAluno(chatprivadoDto.getAluno());
        chatprivado.setProfessor(chatprivadoDto.getProfessor());
        return chatprivado;
    }

    public ChatPrivadoDTO toDTO(ChatPrivado chatprivado){
        ChatPrivadoDTO chatprivadoDTO = new ChatPrivadoDTO();
        chatprivadoDTO.setId(chatprivado.getId());
        chatprivadoDTO.setAluno(chatprivado.getAluno());
        chatprivadoDTO.setProfessor(chatprivado.getProfessor());
        return chatprivadoDTO;
    }

    public List<ChatPrivado> getAll(){
        return chatprivadorepository.findAll();
    }

    public Optional<ChatPrivadoDTO> getById(Long id){
        Optional<ChatPrivado> optionalChatPrivado = chatprivadorepository.findById(id);
        if(optionalChatPrivado.isPresent()){
            return Optional.of(this.toDTO(optionalChatPrivado.get()));
        }else {
            return Optional.empty();
        }
    }

    public ChatPrivadoDTO saveDto(ChatPrivadoDTO chatprivadoDTO){
        ChatPrivado chatprivado = this.fromDTO(chatprivadoDTO);
        ChatPrivado chatprivadoBd = chatprivadorepository.save(chatprivado);
        return this.toDTO(chatprivadoBd);
    }

    public boolean delete(Long id){
        if(chatprivadorepository.existsById(id)){
            chatprivadorepository.deleteById(id);
            return true;
        }else {
            return false;
        }
    }
}
