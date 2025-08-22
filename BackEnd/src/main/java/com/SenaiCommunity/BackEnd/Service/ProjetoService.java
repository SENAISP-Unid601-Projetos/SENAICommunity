package com.SenaiCommunity.BackEnd.Service;

import com.SenaiCommunity.BackEnd.DTO.ProjetoDTO;
import com.SenaiCommunity.BackEnd.Entity.*;
import com.SenaiCommunity.BackEnd.Repository.*;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProjetoService {

    @Autowired
    private ProjetoRepository projetoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private ProfessorRepository professorRepository;

    @Autowired
    private AlunoRepository alunoRepository;

    @Autowired
    private ProjetoMembroRepository projetoMembroRepository;

    @Autowired
    private ConviteProjetoRepository conviteProjetoRepository;

    public List<ProjetoDTO> listarTodos() {
        List<Projeto> projetos = projetoRepository.findAll();
        return projetos.stream().map(this::converterParaDTO).collect(Collectors.toList());
    }

    public ProjetoDTO buscarPorId(Long id) {
        Projeto projeto = projetoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Projeto não encontrado com id: " + id));
        return converterParaDTO(projeto);
    }

    @Transactional
    public ProjetoDTO salvar(ProjetoDTO dto) {
        Projeto projeto = new Projeto();
        boolean isNovoGrupo = dto.getId() == null;

        if (!isNovoGrupo) {
            projeto = projetoRepository.findById(dto.getId())
                    .orElseThrow(() -> new EntityNotFoundException("Projeto não encontrado para atualização"));
        }

        projeto.setTitulo(dto.getTitulo());
        projeto.setDescricao(dto.getDescricao());
        projeto.setDataInicio(dto.getDataInicio());
        projeto.setDataEntrega(dto.getDataEntrega());
        projeto.setStatus(dto.getStatus());

        projeto.setImagemUrl(dto.getImagemUrl());
        projeto.setMaxMembros(dto.getMaxMembros() != null ? dto.getMaxMembros() : 50);
        projeto.setGrupoPrivado(dto.getGrupoPrivado() != null ? dto.getGrupoPrivado() : false);

        if (isNovoGrupo) {
            projeto.setDataCriacao(LocalDateTime.now());
        }

        // Autor
        Usuario autor = usuarioRepository.findById(dto.getAutorId())
                .orElseThrow(() -> new EntityNotFoundException("Autor não encontrado com id: " + dto.getAutorId()));
        projeto.setAutor(autor);

        // Manter compatibilidade com código existente
        if (dto.getProfessorIds() != null && !dto.getProfessorIds().isEmpty()) {
            List<Professor> professores = dto.getProfessorIds().stream()
                    .map(id -> professorRepository.findById(id)
                            .orElseThrow(() -> new EntityNotFoundException("Professor não encontrado com id: " + id)))
                    .collect(Collectors.toList());
            projeto.setProfessores(professores);
        }

        if (dto.getAlunoIds() != null && !dto.getAlunoIds().isEmpty()) {
            List<Aluno> alunos = dto.getAlunoIds().stream()
                    .map(id -> alunoRepository.findById(id)
                            .orElseThrow(() -> new EntityNotFoundException("Aluno não encontrado com id: " + id)))
                    .collect(Collectors.toList());
            projeto.setAlunos(alunos);
        }

        Projeto salvo = projetoRepository.save(projeto);

        if (isNovoGrupo) {
            adicionarMembroComoAdmin(salvo, autor);
        }

        return converterParaDTO(salvo);
    }

    @Transactional
    public void enviarConvite(Long projetoId, Long usuarioConvidadoId, Long usuarioConvidadorId) {
        Projeto projeto = projetoRepository.findById(projetoId)
                .orElseThrow(() -> new EntityNotFoundException("Projeto não encontrado"));

        Usuario usuarioConvidado = usuarioRepository.findById(usuarioConvidadoId)
                .orElseThrow(() -> new EntityNotFoundException("Usuário convidado não encontrado"));

        Usuario usuarioConvidador = usuarioRepository.findById(usuarioConvidadorId)
                .orElseThrow(() -> new EntityNotFoundException("Usuário convidador não encontrado"));

        // Verificar se o convidador é admin
        if (!isAdmin(projetoId, usuarioConvidadorId)) {
            throw new IllegalArgumentException("Apenas administradores podem enviar convites");
        }

        // Verificar se já é membro
        if (projetoMembroRepository.existsByProjetoIdAndUsuarioId(projetoId, usuarioConvidadoId)) {
            throw new IllegalArgumentException("Usuário já é membro do grupo");
        }

        // Verificar se já tem convite pendente
        if (conviteProjetoRepository.existsByProjetoIdAndUsuarioConvidadoIdAndStatus(
                projetoId, usuarioConvidadoId, ConviteProjeto.StatusConvite.PENDENTE)) {
            throw new IllegalArgumentException("Usuário já possui convite pendente");
        }

        Integer totalMembros = projetoMembroRepository.countMembrosByProjetoId(projetoId);
        if (totalMembros == null) totalMembros = 0;

        Integer maxMembros = projeto.getMaxMembros();
        if (maxMembros == null) maxMembros = 50;

        if (totalMembros >= maxMembros) {
            throw new IllegalArgumentException("Grupo atingiu o limite máximo de membros");
        }

        ConviteProjeto convite = new ConviteProjeto();
        convite.setProjeto(projeto);
        convite.setUsuarioConvidado(usuarioConvidado);
        convite.setConvidadoPor(usuarioConvidador);
        convite.setStatus(ConviteProjeto.StatusConvite.PENDENTE);
        convite.setDataConvite(LocalDateTime.now());

        conviteProjetoRepository.save(convite);
    }

    @Transactional
    public void aceitarConvite(Long conviteId, Long usuarioId) {
        ConviteProjeto convite = conviteProjetoRepository.findById(conviteId)
                .orElseThrow(() -> new EntityNotFoundException("Convite não encontrado"));

        if (!convite.getUsuarioConvidado().getId().equals(usuarioId)) {
            throw new IllegalArgumentException("Usuário não autorizado a aceitar este convite");
        }

        if (convite.getStatus() != ConviteProjeto.StatusConvite.PENDENTE) {
            throw new IllegalArgumentException("Convite não está pendente");
        }

        Integer totalMembros = projetoMembroRepository.countMembrosByProjetoId(convite.getProjeto().getId());
        if (totalMembros == null) totalMembros = 0;

        Integer maxMembros = convite.getProjeto().getMaxMembros();
        if (maxMembros == null) maxMembros = 50;

        if (totalMembros >= maxMembros) {
            throw new IllegalArgumentException("Grupo atingiu o limite máximo de membros");
        }

        // Aceitar convite
        convite.setStatus(ConviteProjeto.StatusConvite.ACEITO);
        convite.setDataResposta(LocalDateTime.now());
        conviteProjetoRepository.save(convite);

        // Adicionar como membro
        ProjetoMembro membro = new ProjetoMembro();
        membro.setProjeto(convite.getProjeto());
        membro.setUsuario(convite.getUsuarioConvidado());
        membro.setRole(ProjetoMembro.RoleMembro.MEMBRO);
        membro.setDataEntrada(LocalDateTime.now());
        membro.setConvidadoPor(convite.getConvidadoPor());

        projetoMembroRepository.save(membro);
    }

    @Transactional
    public void expulsarMembro(Long projetoId, Long membroId, Long adminId) {
        if (!isAdmin(projetoId, adminId)) {
            throw new IllegalArgumentException("Apenas administradores podem expulsar membros");
        }

        ProjetoMembro membro = projetoMembroRepository.findByProjetoIdAndUsuarioId(projetoId, membroId)
                .orElseThrow(() -> new EntityNotFoundException("Membro não encontrado no projeto"));

        // Não pode expulsar o criador do projeto
        Projeto projeto = projetoRepository.findById(projetoId).orElseThrow();
        if (membro.getUsuario().getId().equals(projeto.getAutor().getId())) {
            throw new IllegalArgumentException("Não é possível expulsar o criador do projeto");
        }

        projetoMembroRepository.delete(membro);
    }

    @Transactional
    public void alterarPermissao(Long projetoId, Long membroId, ProjetoMembro.RoleMembro novaRole, Long adminId) {
        if (!isAdmin(projetoId, adminId)) {
            throw new IllegalArgumentException("Apenas administradores podem alterar permissões");
        }

        ProjetoMembro membro = projetoMembroRepository.findByProjetoIdAndUsuarioId(projetoId, membroId)
                .orElseThrow(() -> new EntityNotFoundException("Membro não encontrado no projeto"));

        // Não pode alterar permissão do criador
        Projeto projeto = projetoRepository.findById(projetoId).orElseThrow();
        if (membro.getUsuario().getId().equals(projeto.getAutor().getId())) {
            throw new IllegalArgumentException("Não é possível alterar permissão do criador do projeto");
        }

        membro.setRole(novaRole);
        projetoMembroRepository.save(membro);
    }

    @Transactional
    public void atualizarInfoGrupo(Long projetoId, String novoTitulo, String novaDescricao, String novaImagemUrl, Long adminId) {
        if (!isAdmin(projetoId, adminId)) {
            throw new IllegalArgumentException("Apenas administradores podem alterar informações do grupo");
        }

        Projeto projeto = projetoRepository.findById(projetoId)
                .orElseThrow(() -> new EntityNotFoundException("Projeto não encontrado"));

        if (novoTitulo != null) projeto.setTitulo(novoTitulo);
        if (novaDescricao != null) projeto.setDescricao(novaDescricao);
        if (novaImagemUrl != null) projeto.setImagemUrl(novaImagemUrl);

        projetoRepository.save(projeto);
    }

    private boolean isAdmin(Long projetoId, Long usuarioId) {
        // Verificar se é o criador do projeto
        Projeto projeto = projetoRepository.findById(projetoId).orElse(null);
        if (projeto != null && projeto.getAutor() != null && projeto.getAutor().getId().equals(usuarioId)) {
            return true;
        }

        // Verificar se tem role de ADMIN
        ProjetoMembro membro = projetoMembroRepository.findByProjetoIdAndUsuarioId(projetoId, usuarioId).orElse(null);
        return membro != null && membro.getRole() == ProjetoMembro.RoleMembro.ADMIN;
    }

    private void adicionarMembroComoAdmin(Projeto projeto, Usuario usuario) {
        ProjetoMembro membro = new ProjetoMembro();
        membro.setProjeto(projeto);
        membro.setUsuario(usuario);
        membro.setRole(ProjetoMembro.RoleMembro.ADMIN);
        membro.setDataEntrada(LocalDateTime.now());
        projetoMembroRepository.save(membro);
    }

    public void deletar(Long id) {
        if (!projetoRepository.existsById(id)) {
            throw new EntityNotFoundException("Projeto não encontrado com id: " + id);
        }
        projetoRepository.deleteById(id);
    }

    private ProjetoDTO converterParaDTO(Projeto projeto) {
        ProjetoDTO dto = new ProjetoDTO();

        dto.setId(projeto.getId());
        dto.setTitulo(projeto.getTitulo());
        dto.setDescricao(projeto.getDescricao());
        dto.setDataInicio(projeto.getDataInicio());
        dto.setDataEntrega(projeto.getDataEntrega());
        dto.setStatus(projeto.getStatus());

        dto.setImagemUrl(projeto.getImagemUrl());
        dto.setDataCriacao(projeto.getDataCriacao());
        dto.setMaxMembros(projeto.getMaxMembros());
        dto.setGrupoPrivado(projeto.getGrupoPrivado());

        dto.setAutorId(projeto.getAutor() != null ? projeto.getAutor().getId() : null);
        dto.setAutorNome(projeto.getAutor() != null ? projeto.getAutor().getNome() : null);

        // Manter compatibilidade
        if (projeto.getProfessores() != null) {
            dto.setProfessorIds(projeto.getProfessores().stream()
                    .map(Professor::getId)
                    .collect(Collectors.toList()));
        }

        if (projeto.getAlunos() != null) {
            dto.setAlunoIds(projeto.getAlunos().stream()
                    .map(Aluno::getId)
                    .collect(Collectors.toList()));
        }

        List<ProjetoMembro> membros;
        try {
            membros = projetoMembroRepository.findByProjetoId(projeto.getId());
        } catch (Exception e) {
            membros = List.of(); // Lista vazia em caso de erro
        }

        dto.setTotalMembros(membros.size());

        dto.setMembros(membros.stream().map(membro -> {
            ProjetoDTO.MembroDTO membroDTO = new ProjetoDTO.MembroDTO();
            membroDTO.setId(membro.getId());
            membroDTO.setUsuarioId(membro.getUsuario().getId());
            membroDTO.setUsuarioNome(membro.getUsuario().getNome());
            membroDTO.setUsuarioEmail(membro.getUsuario().getEmail());
            membroDTO.setRole(membro.getRole());
            membroDTO.setDataEntrada(membro.getDataEntrada());
            membroDTO.setConvidadoPorNome(membro.getConvidadoPor() != null ?
                    membro.getConvidadoPor().getNome() : "Criador do grupo");
            return membroDTO;
        }).collect(Collectors.toList()));

        List<ConviteProjeto> convitesPendentes;
        try {
            convitesPendentes = conviteProjetoRepository
                    .findByProjetoIdAndStatus(projeto.getId(), ConviteProjeto.StatusConvite.PENDENTE);
        } catch (Exception e) {
            convitesPendentes = List.of(); // Lista vazia em caso de erro
        }

        dto.setConvitesPendentes(convitesPendentes.stream().map(convite -> {
            ProjetoDTO.ConviteDTO conviteDTO = new ProjetoDTO.ConviteDTO();
            conviteDTO.setId(convite.getId());
            conviteDTO.setUsuarioConvidadoId(convite.getUsuarioConvidado().getId());
            conviteDTO.setUsuarioConvidadoNome(convite.getUsuarioConvidado().getNome());
            conviteDTO.setUsuarioConvidadoEmail(convite.getUsuarioConvidado().getEmail());
            conviteDTO.setConvidadoPorNome(convite.getConvidadoPor().getNome());
            conviteDTO.setDataConvite(convite.getDataConvite());
            return conviteDTO;
        }).collect(Collectors.toList()));

        return dto;
    }
}
