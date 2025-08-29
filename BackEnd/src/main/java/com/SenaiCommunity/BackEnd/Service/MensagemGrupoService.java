package com.SenaiCommunity.BackEnd.Service;

import com.SenaiCommunity.BackEnd.DTO.MensagemGrupoEntradaDTO;
import com.SenaiCommunity.BackEnd.DTO.MensagemGrupoSaidaDTO;
import com.SenaiCommunity.BackEnd.Entity.MensagemGrupo;
import com.SenaiCommunity.BackEnd.Entity.Projeto;
import com.SenaiCommunity.BackEnd.Entity.Usuario;
import com.SenaiCommunity.BackEnd.Repository.MensagemGrupoRepository;
import com.SenaiCommunity.BackEnd.Repository.ProjetoRepository;
import com.SenaiCommunity.BackEnd.Repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;
<<<<<<< HEAD
=======
import java.util.stream.Collectors;
>>>>>>> back

@Service
public class MensagemGrupoService {

    @Autowired
    private UsuarioRepository usuarioRepository;
    @Autowired
    private ProjetoRepository projetoRepository;
    @Autowired
    private MensagemGrupoRepository mensagemGrupoRepository;

    private MensagemGrupoSaidaDTO toDTO(MensagemGrupo mensagem) {
        return MensagemGrupoSaidaDTO.builder()
                .id(mensagem.getId())
                .conteudo(mensagem.getConteudo())
                .dataEnvio(mensagem.getDataEnvio())
                .grupoId(mensagem.getProjeto().getId()) // Adicionado para consistência
                .autorId(mensagem.getAutor().getId())
                .nomeAutor(mensagem.getAutor().getNome())
                .build();
    }

    private MensagemGrupo toEntity(MensagemGrupoEntradaDTO dto, Usuario autor, Projeto projeto) {
        return MensagemGrupo.builder()
                .conteudo(dto.getConteudo())
                .dataEnvio(LocalDateTime.now())
                .projeto(projeto)
                .autor(autor)
                .build();
    }

    @Transactional
    public MensagemGrupoSaidaDTO salvarMensagemGrupo(MensagemGrupoEntradaDTO dto, Long projetoId, String autorUsername) {
        Usuario autor = usuarioRepository.findByEmail(autorUsername)
                .orElseThrow(() -> new NoSuchElementException("Usuário não encontrado"));

        Projeto projeto = projetoRepository.findById(projetoId)
                .orElseThrow(() -> new NoSuchElementException("Projeto não encontrado"));

        MensagemGrupo novaMensagem = toEntity(dto, autor, projeto);
        MensagemGrupo mensagemSalva = mensagemGrupoRepository.save(novaMensagem);

        return toDTO(mensagemSalva);
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

    public MensagemGrupo excluirMensagemGrupo(Long id, String autorUsername) {
        MensagemGrupo mensagem = mensagemGrupoRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Mensagem não encontrada"));
        if (!mensagem.getAutorUsername().equals(autorUsername)) {
            throw new SecurityException("Você não pode excluir esta mensagem.");
        }
        mensagemGrupoRepository.delete(mensagem);
        return mensagem;
    }

<<<<<<< HEAD
    public List<MensagemGrupo> buscarMensagensDoGrupo(Long projetoId) {
        return mensagemGrupoRepository.findByProjetoIdOrderByDataEnvioAsc(projetoId);
=======
    public List<MensagemGrupoSaidaDTO> buscarMensagensPorProjeto(Long projetoId) {
        List<MensagemGrupo> mensagens = mensagemGrupoRepository.findByProjetoIdOrderByDataEnvioAsc(projetoId);

        // Converte a lista de entidades para uma lista de DTOs antes de retornar
        return mensagens.stream()
                .map(this::toDTO) // Usa o método toDTO que você já criou
                .collect(Collectors.toList());
>>>>>>> back
    }
}