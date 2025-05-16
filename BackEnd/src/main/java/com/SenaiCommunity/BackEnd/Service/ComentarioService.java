package com.SenaiCommunity.BackEnd.Service;

import com.SenaiCommunity.BackEnd.Dto.ComentarioDto;
import com.SenaiCommunity.BackEnd.Entity.Comentario;
import com.SenaiCommunity.BackEnd.Entity.Participacao;
import com.SenaiCommunity.BackEnd.Repository.ComentarioRepository;
import com.SenaiCommunity.BackEnd.Repository.ParticipacaoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class ComentarioService {
    @Autowired
    private ComentarioRepository comentariorepository;


    public Comentario fromDTO(ComentarioDto comentarioDto){
        Comentario comentario = new Comentario();
        comentario.setConteudo(comentarioDto.getConteudo());
        comentario.setDataComentario(comentarioDto.getDataComentario());
        comentario.setAutor(comentarioDto.getAutor());
        comentario.setPostagem(comentarioDto.getPostagem());
        return comentario;
    }

    public ComentarioDto toDTO(Comentario comentario){
        ComentarioDto comentarioDTO = new ComentarioDto();
        comentarioDTO.setId(comentario.getId());
        comentarioDTO.setConteudo(comentario.getConteudo());
        comentarioDTO.setDataComentario(comentario.getDataComentario());
        comentarioDTO.setAutor(comentario.getAutor());
        comentarioDTO.setPostagem(comentario.getPostagem());
        return comentarioDTO;
    }

    public List<Comentario> getAll(){
        return comentariorepository.findAll();
    }

    public List<Comentario> getByData(LocalDateTime dataComentario){
        return comentariorepository.findAllByData(dataComentario);

    }

    public Optional<ComentarioDto> getById(Long id){
        Optional<Comentario> optionalComentario = comentariorepository.findById(id);
        if(optionalComentario.isPresent()){
            return Optional.of(this.toDTO(optionalComentario.get()));
        }else {
            return Optional.empty();
        }
    }

    public ComentarioDto saveDto(ComentarioDto comentarioDTO){
        Comentario comentario = this.fromDTO(comentarioDTO);
        Comentario comentarioBd = comentariorepository.save(comentario);
        return this.toDTO(comentarioBd);
    }

    public Optional<ComentarioDto> updateComentario(Long id, ComentarioDto comentarioDTO){
        Optional<Comentario> optionalComentario = comentariorepository.findById(id);
        if(optionalComentario.isPresent()){
            Comentario comentario = optionalComentario.get();
            comentario.setConteudo(comentarioDTO.getConteudo());
            Comentario comentarioUpdate = comentariorepository.save(comentario);

            return Optional.of(this.toDTO(comentarioUpdate));
        }else {
            return Optional.empty();
        }
    }

    public boolean delete(Long id){
        if(comentariorepository.existsById(id)){
            comentariorepository.deleteById(id);
            return true;
        }else {
            return false;
        }
    }
}
