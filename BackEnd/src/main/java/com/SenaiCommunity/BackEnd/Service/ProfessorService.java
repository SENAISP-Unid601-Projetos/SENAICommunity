package com.SenaiCommunity.BackEnd.Service;
import com.SenaiCommunity.BackEnd.DTO.ProfessorDTO;
import com.SenaiCommunity.BackEnd.Entity.Professor;
import com.SenaiCommunity.BackEnd.Entity.Participacao;
import com.SenaiCommunity.BackEnd.Entity.Professor;
import com.SenaiCommunity.BackEnd.Repository.ProfessorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ProfessorService {
    @Autowired
    private ProfessorRepository professorrepository;

    public Professor fromDTO(ProfessorDTO professorDto){
        Professor professor = new Professor();
        professor.setNome(professorDto.getNomeCompleto());
        professor.setFormacao(professorDto.getFormacao());
        professor.setAreaAtuacao(professorDto.getAreaAtuacao());
        professor.setCodigoSn(professorDto.getCodigoSn());
        professor.setEmail(professorDto.getEmail());
        professor.setFotoPerfil(professorDto.getFotoPerfil());
        professor.setBio(professorDto.getBio());
        professor.setDataCadastro(professorDto.getDataCadastro());
        professor.setDataNascimento(professorDto.getDataNascimento());
        professor.setTelefones(professorDto.getTelefones());
        professor.setAvaliacoes(professorDto.getAvaliacoes());

        return professor;
    }

    public ProfessorDTO toDTO(Professor professor){
        ProfessorDTO professorDTO = new ProfessorDTO();
        professorDTO.setId(professor.getId());
        professorDTO.setNomeCompleto(professor.getNome());
        professorDTO.setFormacao(professor.getFormacao());
        professorDTO.setAreaAtuacao(professor.getAreaAtuacao());
        professorDTO.setCodigoSn(professor.getCodigoSn());
        professorDTO.setEmail(professor.getEmail());
        professorDTO.setFotoPerfil(professor.getFotoPerfil());
        professorDTO.setBio(professor.getBio());
        professorDTO.setDataCadastro(professor.getDataCadastro());
        professorDTO.setDataNascimento(professor.getDataNascimento());
        professorDTO.setTelefones(professor.getTelefones());
        professorDTO.setAvaliacoes(professor.getAvaliacoes());

        return professorDTO;
    }

    public List<Professor> getAll(){
        return professorrepository.findAll();
    }

    public List<Professor> getByNome(String nome){
        return professorrepository.findAllByNome(nome);

    }

    public Optional<ProfessorDTO> getById(Long id){
        Optional<Professor> optionalProfessor = professorrepository.findById(id);
        if(optionalProfessor.isPresent()){
            return Optional.of(this.toDTO(optionalProfessor.get()));
        }else {
            return Optional.empty();
        }
    }

    public ProfessorDTO saveDto(ProfessorDTO professorDTO){
        Professor professor = this.fromDTO(professorDTO);
        Professor professorBd = professorrepository.save(professor);
        return this.toDTO(professorBd);
    }

    public Optional<ProfessorDTO> updateProfessor(Long id, ProfessorDTO professorDto){
        Optional<Professor> optionalProfessor = professorrepository.findById(id);
        if(optionalProfessor.isPresent()){
            Professor professor = optionalProfessor.get();
            professor.setNome(professorDto.getNomeCompleto());
            professor.setFormacao(professorDto.getFormacao());
            professor.setAreaAtuacao(professorDto.getAreaAtuacao());
            professor.setEmail(professorDto.getEmail());
            professor.setFotoPerfil(professorDto.getFotoPerfil());
            professor.setBio(professorDto.getBio());
            professor.setDataNascimento(professorDto.getDataNascimento());
            professor.setTelefones(professorDto.getTelefones());

            Professor professorUpdate = professorrepository.save(professor);

            return Optional.of(this.toDTO(professorUpdate));
        }else {
            return Optional.empty();
        }
    }

    public boolean delete(Long id){
        if(professorrepository.existsById(id)){
            professorrepository.deleteById(id);
            return true;
        }else {
            return false;
        }
    }
}
