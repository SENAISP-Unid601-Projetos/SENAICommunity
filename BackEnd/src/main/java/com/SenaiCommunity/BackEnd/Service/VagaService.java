package com.SenaiCommunity.BackEnd.Service;

import com.SenaiCommunity.BackEnd.DTO.VagaEntradaDTO;
import com.SenaiCommunity.BackEnd.DTO.VagaSaidaDTO;
import com.SenaiCommunity.BackEnd.Entity.Usuario;
import com.SenaiCommunity.BackEnd.Entity.Vaga;
import com.SenaiCommunity.BackEnd.Exception.ConteudoImproprioException;
import com.SenaiCommunity.BackEnd.Repository.UsuarioRepository;
import com.SenaiCommunity.BackEnd.Repository.VagaRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class VagaService {

    @Autowired
    private VagaRepository vagaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private FiltroProfanidadeService filtroProfanidade;

    @Transactional
    public VagaSaidaDTO criar(VagaEntradaDTO dto, String autorEmail) {

        // Validação de conteúdo impróprio (mantida)
        if (filtroProfanidade.contemProfanidade(dto.getTitulo()) ||
                filtroProfanidade.contemProfanidade(dto.getDescricao()) ||
                filtroProfanidade.contemProfanidade(dto.getEmpresa())) {
            throw new ConteudoImproprioException("Os dados da vaga contêm texto não permitido.");
        }

        Usuario autor = usuarioRepository.findByEmail(autorEmail)
                .orElseThrow(() -> new EntityNotFoundException("Usuário autor não encontrado."));

        Vaga vaga = new Vaga();
        vaga.setTitulo(dto.getTitulo());
        vaga.setDescricao(dto.getDescricao());
        vaga.setEmpresa(dto.getEmpresa());
        vaga.setLocalizacao(dto.getLocalizacao());
        vaga.setNivel(dto.getNivel());
        vaga.setTipoContratacao(dto.getTipoContratacao());

        // --- NOVOS CAMPOS ADICIONADOS AQUI ---
        vaga.setSalario(dto.getSalario());

        // Verifica se a lista não é nula antes de setar para evitar NullPointerException
        if (dto.getRequisitos() != null) {
            vaga.setRequisitos(dto.getRequisitos());
        }

        if (dto.getBeneficios() != null) {
            vaga.setBeneficios(dto.getBeneficios());
        }
        // -------------------------------------

        vaga.setDataPublicacao(LocalDateTime.now());
        vaga.setAutor(autor);

        Vaga vagaSalva = vagaRepository.save(vaga);
        return new VagaSaidaDTO(vagaSalva);
    }

    public List<VagaSaidaDTO> listarTodas() {
        return vagaRepository.findAll().stream()
                .map(VagaSaidaDTO::new)
                .collect(Collectors.toList());
    }
}