package com.SenaiCommunity.BackEnd.Service;

import com.SenaiCommunity.BackEnd.Dto.GruposDto;
import com.SenaiCommunity.BackEnd.Entity.Grupos;
import com.SenaiCommunity.BackEnd.Entity.Participacao;
import com.SenaiCommunity.BackEnd.Repository.GruposRepository;
import com.SenaiCommunity.BackEnd.Repository.ParticipacaoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class GruposService {
    @Autowired
    private GruposRepository gruposrepository;
    @Autowired
    private ParticipacaoRepository participacaorepository;

    public Grupos fromDTO(GruposDto gruposDto){
        Grupos grupos = new Grupos();
        grupos.setNome(gruposDto.getNome());
        grupos.setDescricao(gruposDto.getDescricao());
        grupos.setDataCriacao(gruposDto.getDataCriacao());
        grupos.setProjeto(gruposDto.getProjeto());
        return grupos;
    }

    public GruposDto toDTO(Grupos grupos){
        GruposDto gruposDTO = new GruposDto();
        gruposDTO.setId(grupos.getId());
        gruposDTO.setNome(grupos.getNome());
        gruposDTO.setDescricao(grupos.getDescricao());
        gruposDTO.setDataCriacao(grupos.getDataCriacao());
        gruposDTO.setProjeto(grupos.getProjeto());
        return gruposDTO;
    }

    public List<Grupos> getAll(){
        return gruposrepository.findAll();
    }

    public List<Grupos> getByNome(String nome){
        return gruposrepository.findAllByNome(nome);

    }

    public Optional<GruposDto> getById(Long id){
        Optional<Grupos> optionalGrupos = gruposrepository.findById(id);
        if(optionalGrupos.isPresent()){
            return Optional.of(this.toDTO(optionalGrupos.get()));
        }else {
            return Optional.empty();
        }
    }

    public GruposDto saveDto(GruposDto gruposDTO){
        Grupos grupos = this.fromDTO(gruposDTO);
        Grupos gruposBd = gruposrepository.save(grupos);
        return this.toDTO(gruposBd);
    }

    public Optional<GruposDto> updateGrupos(Long id, GruposDto gruposDTO){
        Optional<Grupos> optionalGrupos = gruposrepository.findById(id);
        if(optionalGrupos.isPresent()){
            Grupos grupos = optionalGrupos.get();
            grupos.setNome(gruposDTO.getNome());
            grupos.setDescricao(gruposDTO.getDescricao());
            grupos.setDataCriacao(gruposDTO.getDataCriacao());
            Grupos gruposUpdate = gruposrepository.save(grupos);

            return Optional.of(this.toDTO(gruposUpdate));
        }else {
            return Optional.empty();
        }
    }
    public boolean addParticipacaoGrupo(Long id, Long idParticipacao){
        Optional<Grupos> optionalGrupos = gruposrepository.findById(id);
        if(!optionalGrupos.isPresent()){
            return  false;
        }
        Optional<Participacao> optionalParticipacao = participacaorepository.findById(id);
        if(!optionalParticipacao.isPresent()){
            return  false;
        }
        Grupos grupos = optionalGrupos.get();
        Participacao participacao = optionalParticipacao.get();
        participacao.setGrupos(grupos);
        participacaorepository.save(participacao);
        return true;
    }
    public boolean delete(Long id){
        if(gruposrepository.existsById(id)){
            gruposrepository.deleteById(id);
            return true;
        }else {
            return false;
        }
    }
}
