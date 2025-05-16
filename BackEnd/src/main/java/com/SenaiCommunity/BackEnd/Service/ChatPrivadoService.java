package com.SenaiCommunity.BackEnd.Service;

import com.SenaiCommunity.BackEnd.Dto.ChatPrivadoDto;
import com.SenaiCommunity.BackEnd.Entity.ChatPrivadoDto;
import com.SenaiCommunity.BackEnd.Entity.ChatPrivado;
import com.SenaiCommunity.BackEnd.Entity.Participacao;
import com.SenaiCommunity.BackEnd.Entity.ChatPrivadoRepository;
import com.SenaiCommunity.BackEnd.Repository.ChatPrivadoRepository;
import com.SenaiCommunity.BackEnd.Repository.ParticipacaoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ChatPrivadoService {
    @Autowired
    private ChatPrivadoRepository chatprivadorepository;

    public ChatPrivado fromDTO(ChatPrivadoDto chatprivadoDto){
        ChatPrivado chatprivado = new ChatPrivado();
        chatprivado.setAluno(chatprivadoDto.getAluno());
        chatprivado.setProfessor(chatprivadoDto.getProfessor());
        return chatprivado;
    }

    public ChatPrivadoDto toDTO(ChatPrivado chatprivado){
        ChatPrivadoDto chatprivadoDTO = new ChatPrivadoDto();
        chatprivadoDTO.setId(chatprivado.getId());
        chatprivadoDTO.setAluno(chatprivado.getAluno());
        chatprivadoDTO.setProfessor(chatprivado.getProfessor());
        return chatprivadoDTO;
    }

    public List<ChatPrivado> getAll(){
        return chatprivadorepository.findAll();
    }

    public Optional<ChatPrivadoDto> getById(Long id){
        Optional<ChatPrivado> optionalChatPrivado = chatprivadorepository.findById(id);
        if(optionalChatPrivado.isPresent()){
            return Optional.of(this.toDTO(optionalChatPrivado.get()));
        }else {
            return Optional.empty();
        }
    }

    public ChatPrivadoDto saveDto(ChatPrivadoDto chatprivadoDTO){
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
