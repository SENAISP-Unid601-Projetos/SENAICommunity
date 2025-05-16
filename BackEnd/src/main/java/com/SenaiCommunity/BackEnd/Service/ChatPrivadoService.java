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
        chatprivado.setAluno(chatprivadoDto.get);
        chatprivado.setDescricao(chatprivadoDto.getDescricao());
        chatprivado.setDataCriacao(chatprivadoDto.getDataCriacao());
        chatprivado.setProjeto(chatprivadoDto.getProjeto());
        return chatprivado;
    }

    public ChatPrivadoDto toDTO(ChatPrivado chatprivado){
        ChatPrivadoDto chatprivadoDTO = new ChatPrivado()Dto();
        chatprivadoDTO.setId(chatprivado.getId());
        chatprivadoDTO.setNome(chatprivado.getNome());
        chatprivadoDTO.setDescricao(chatprivado.getDescricao());
        chatprivadoDTO.setDataCriacao(chatprivado.getDataCriacao());
        chatprivadoDTO.setProjeto(chatprivado.getProjeto());
        return chatprivadoDTO;
    }

    public List<ChatPrivado> getAll(){
        return chatprivadorepository.findAll();
    }

    public List<ChatPrivado> getByNome(String nome){
        return chatprivadorepository.findAllByNome(nome);

    }

    public Optional<ChatPrivadoDto> getById(Long id){
        Optional<ChatPrivado> optionalChatPrivado = chatprivadorepository.findById(id);
        if(ChatPrivado.isPresent()){
            return Optional.of(this.toDTO(ChatPrivado.get()));
        }else {
            return Optional.empty();
        }
    }

    public ChatPrivadoDto saveDto(ChatPrivadoDto chatprivadoDTO){
        ChatPrivado chatprivado = this.fromDTO(chatprivadoDTO);
        ChatPrivado chatprivadoBd = chatprivadorepository.save(chatprivado);
        return this.toDTO(chatprivadoBd);
    }

    public Optional<ChatPrivadoDto> updateChatPrivado(Long id, ChatPrivadoDto chatprivadoDTO){
        Optional<ChatPrivado> optionalChatPrivado = chatprivadorepository.findById(id);
        if(ChatPrivado.isPresent()){
            ChatPrivado chatprivado = ChatPrivado.get();
            chatprivado.setNome(chatprivadoDTO.getNome());
            chatprivado.setDescricao(chatprivadoDTO.getDescricao());
            chatprivado.setDataCriacao(chatprivadoDTO.getDataCriacao());
            ChatPrivado chatprivadoUpdate = chatprivadorepository.save(chatprivado);

            return Optional.of(this.toDTO(chatprivadoUpdate));
        }else {
            return Optional.empty();
        }
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
