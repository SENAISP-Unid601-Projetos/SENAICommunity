package com.SenaiCommunity.BackEnd.Service;

import com.SenaiCommunity.BackEnd.DTO.MensagemGrupoEntradaDTO;
import com.SenaiCommunity.BackEnd.DTO.MensagemGrupoSaidaDTO;
import com.SenaiCommunity.BackEnd.Entity.MensagemGrupo;
import com.SenaiCommunity.BackEnd.Entity.Projeto;
import com.SenaiCommunity.BackEnd.Entity.Usuario;
import com.SenaiCommunity.BackEnd.Repository.ArquivoMidiaRepository;
import com.SenaiCommunity.BackEnd.Repository.MensagemGrupoRepository;
import com.SenaiCommunity.BackEnd.Repository.ProjetoRepository;
import com.SenaiCommunity.BackEnd.Repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;


@Service
public class MensagemGrupoService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private ArquivoMidiaRepository arquivoMidiaRepository;

    @Autowired
    private ProjetoRepository projetoRepository;

    @Autowired
    private MensagemGrupoRepository mensagemGrupoRepository;

    private MensagemGrupoSaidaDTO toDTO(MensagemGrupo mensagem) {
        return MensagemGrupoSaidaDTO.builder()
                .id(mensagem.getId())
                .conteudo(mensagem.getConteudo())
                .dataEnvio(mensagem.getDataEnvio())
                .autorId(mensagem.getAutor().getId())
                .nomeAutor(mensagem.getAutor().getNome())
                .build();
    }

    private MensagemGrupo toEntity(MensagemGrupoEntradaDTO dto, Usuario autor, Projeto grupo) {
        return MensagemGrupo.builder()
                .conteudo(dto.getConteudo())
                .dataEnvio(LocalDateTime.now())
                .projeto(grupo)
                .autor(autor)
                .build();
    }

    public MensagemGrupo editarMensagemGrupo(Long id, String novoConteudo, String autorUsername) {
        MensagemGrupo mensagem = mensagemGrupoRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Mensagem não encontrada"));

        if (!mensagem.getAutorUsername().equals(autorUsername)) {
            throw new SecurityException("Você não pode editar esta mensagem.");
        }

        mensagem.setConteudo(novoConteudo);
        return mensagemGrupoRepository.save(mensagem);
    }

    // Correção: Alterado o tipo de retorno para MensagemGrupo
    public MensagemGrupo excluirMensagemGrupo(Long id, String autorUsername) {
        MensagemGrupo mensagem = mensagemGrupoRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Mensagem não encontrada"));

        if (!mensagem.getAutorUsername().equals(autorUsername)) {
            throw new SecurityException("Você não pode excluir esta mensagem.");
        }

        mensagemGrupoRepository.delete(mensagem);
        return mensagem; // Retorna a entidade que foi excluída
    }

    public MensagemGrupo salvarMensagemGrupo(MensagemGrupo mensagem, Long projetoId) {
        Usuario autor = usuarioRepository.findByEmail(mensagem.getAutorUsername())
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        Projeto projeto = projetoRepository.findById(projetoId)
                .orElseThrow(() -> new RuntimeException("Projeto não encontrado"));

        mensagem.setAutor(autor);
        mensagem.setProjeto(projeto);
        return mensagemGrupoRepository.save(mensagem);
    }

    public List<MensagemGrupo> buscarMensagensDoGrupo(Long projetoId) {
        return mensagemGrupoRepository.findByProjetoIdOrderByDataEnvioAsc(projetoId);
    }
}