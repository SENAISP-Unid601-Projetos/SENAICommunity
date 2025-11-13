package com.SenaiCommunity.BackEnd.Service;

import com.SenaiCommunity.BackEnd.DTO.ProjetoDTO;
import com.SenaiCommunity.BackEnd.Entity.*;
import com.SenaiCommunity.BackEnd.Exception.ConteudoImproprioException;
import com.SenaiCommunity.BackEnd.Repository.*;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;

import java.time.LocalDateTime;
import java.util.Date;
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

    @Autowired
    private NotificacaoService notificacaoService;

    @Autowired
    private FiltroProfanidadeService filtroProfanidade;

    @Autowired
    private ArquivoMidiaService midiaService;

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
    public ProjetoDTO salvar(ProjetoDTO dto, MultipartFile foto) {

        if (filtroProfanidade.contemProfanidade(dto.getTitulo()) ||
                filtroProfanidade.contemProfanidade(dto.getDescricao())) {
            throw new ConteudoImproprioException("Os dados do projeto contêm texto não permitido.");
        }

        Projeto projeto = new Projeto();
        boolean isNovoGrupo = dto.getId() == null;

        if (!isNovoGrupo) {
            projeto = projetoRepository.findById(dto.getId())
                    .orElseThrow(() -> new EntityNotFoundException("Projeto não encontrado para atualização"));
        }

        projeto.setTitulo(dto.getTitulo());
        projeto.setDescricao(dto.getDescricao());

        if (isNovoGrupo) {
            projeto.setDataInicio(new Date());
        } else {
            projeto.setDataInicio(dto.getDataInicio());
        }
        projeto.setDataEntrega(dto.getDataEntrega());
        if (isNovoGrupo) {
            projeto.setStatus("Em planejamento");
        } else {
            projeto.setStatus(dto.getStatus());
        }

        if (foto != null && !foto.isEmpty()) {
            try {
                String urlCloudinary = midiaService.upload(foto);
                projeto.setImagemUrl(urlCloudinary); // Salva a URL completa

            } catch (IOException e) {
                System.err.println("[ERROR] Erro ao salvar a foto do projeto: " + e.getMessage());
                e.printStackTrace();
                throw new RuntimeException("Erro ao salvar a foto do projeto", e);
            }
        } else if (dto.getImagemUrl() != null) {
            projeto.setImagemUrl(dto.getImagemUrl());
        } else {
            projeto.setImagemUrl(null);
        }

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
            enviarConvitesAutomaticos(salvo, dto.getProfessorIds(), dto.getAlunoIds(), autor.getId());
        }

        return converterParaDTO(salvo);
    }

    private void enviarConvitesAutomaticos(Projeto projeto, List<Long> professorIds, List<Long> alunoIds, Long autorId) {
        if (professorIds != null) {
            for (Long professorId : professorIds) {
                try {
                    enviarConvite(projeto.getId(), professorId, autorId);
                } catch (Exception e) {
                    // Log do erro mas não interrompe o processo
                    System.out.println("Erro ao enviar convite para professor " + professorId + ": " + e.getMessage());
                }
            }
        }

        if (alunoIds != null) {
            for (Long alunoId : alunoIds) {
                try {
                    enviarConvite(projeto.getId(), alunoId, autorId);
                } catch (Exception e) {
                    System.out.println("Erro ao enviar convite para aluno " + alunoId + ": " + e.getMessage());
                }
            }
        }
    }

    @Transactional
    public void enviarConvite(Long projetoId, Long usuarioConvidadoId, Long usuarioConvidadorId) {
        Projeto projeto = projetoRepository.findById(projetoId)
                .orElseThrow(() -> new EntityNotFoundException("Projeto não encontrado"));

        Usuario usuarioConvidado = usuarioRepository.findById(usuarioConvidadoId)
                .orElseThrow(() -> new EntityNotFoundException("Usuário convidado não encontrado"));

        Usuario usuarioConvidador = usuarioRepository.findById(usuarioConvidadorId)
                .orElseThrow(() -> new EntityNotFoundException("Usuário convidador não encontrado"));

        if (!isAdminOuModerador(projetoId, usuarioConvidadorId)) {
            throw new IllegalArgumentException("Apenas administradores e moderadores podem enviar convites");
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

        String mensagem = String.format("Você foi convidado para o projeto '%s' por %s.", projeto.getTitulo(), usuarioConvidador.getNome());
        notificacaoService.criarNotificacao(usuarioConvidado, mensagem, "CONVITE_PROJETO", projeto.getId());
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

        String mensagem = String.format("%s aceitou seu convite e agora faz parte do projeto '%s'.", convite.getUsuarioConvidado().getNome(), convite.getProjeto().getTitulo());
        // Notificar o autor do projeto
        notificacaoService.criarNotificacao(convite.getProjeto().getAutor(), mensagem, "MEMBRO_ADICIONADO", convite.getProjeto().getId());
    }

    @Transactional
    public void expulsarMembro(Long projetoId, Long membroId, Long adminId) {
        if (!isAdminOuModerador(projetoId, adminId)) {
            throw new IllegalArgumentException("Apenas administradores e moderadores podem expulsar membros");
        }

        ProjetoMembro membro = projetoMembroRepository.findByProjetoIdAndUsuarioId(projetoId, membroId)
                .orElseThrow(() -> new EntityNotFoundException("Membro não encontrado no projeto"));

        // Não pode expulsar o criador do projeto
        Projeto projeto = projetoRepository.findById(projetoId).orElseThrow();
        if (membro.getUsuario().getId().equals(projeto.getAutor().getId())) {
            throw new IllegalArgumentException("Não é possível expulsar o criador do projeto");
        }

        ProjetoMembro membroAdmin = projetoMembroRepository.findByProjetoIdAndUsuarioId(projetoId, adminId).orElse(null);
        if (membroAdmin != null && membroAdmin.getRole() == ProjetoMembro.RoleMembro.MODERADOR
                && membro.getRole() == ProjetoMembro.RoleMembro.ADMIN) {
            throw new IllegalArgumentException("Moderadores não podem expulsar administradores");
        }

        projetoMembroRepository.delete(membro);

        String mensagem = String.format("Você foi removido do projeto '%s'.", projeto.getTitulo());
        notificacaoService.criarNotificacao(membro.getUsuario(), mensagem, "MEMBRO_REMOVIDO", projeto.getId());
    }

    @Transactional
    public void alterarPermissao(Long projetoId, Long membroId, ProjetoMembro.RoleMembro novaRole, Long adminId) {
        Projeto projeto = projetoRepository.findById(projetoId).orElseThrow();
        if (!projeto.getAutor().getId().equals(adminId)) {
            throw new IllegalArgumentException("Apenas o criador do projeto pode alterar permissões");
        }

        ProjetoMembro membro = projetoMembroRepository.findByProjetoIdAndUsuarioId(projetoId, membroId)
                .orElseThrow(() -> new EntityNotFoundException("Membro não encontrado no projeto"));

        // Não pode alterar permissão do criador
        if (membro.getUsuario().getId().equals(projeto.getAutor().getId())) {
            throw new IllegalArgumentException("Não é possível alterar permissão do criador do projeto");
        }

        membro.setRole(novaRole);
        projetoMembroRepository.save(membro);

        String mensagem = String.format("Sua permissão no projeto '%s' foi alterada para %s.", projeto.getTitulo(), novaRole.toString());
        notificacaoService.criarNotificacao(membro.getUsuario(), mensagem, "PERMISSAO_ALTERADA", projeto.getId());

    }

    @Transactional
    public void atualizarInfoGrupo(Long projetoId, String novoTitulo, String novaDescricao, String novaImagemUrl,
                                   String novoStatus, Integer novoMaxMembros, Boolean novoGrupoPrivado, Long adminId) {
        if (!isAdmin(projetoId, adminId)) {
            throw new IllegalArgumentException("Apenas administradores podem alterar informações do grupo");
        }

        Projeto projeto = projetoRepository.findById(projetoId)
                .orElseThrow(() -> new EntityNotFoundException("Projeto não encontrado"));

        if (novoTitulo != null) projeto.setTitulo(novoTitulo);
        if (novaDescricao != null) projeto.setDescricao(novaDescricao);
        if (novaImagemUrl != null) projeto.setImagemUrl(novaImagemUrl);
        if (novoStatus != null) {
            if (!novoStatus.equals("Em planejamento") && !novoStatus.equals("Em progresso") && !novoStatus.equals("Concluído")) {
                throw new IllegalArgumentException("Status deve ser: Em planejamento, Em progresso ou Concluído");
            }
            projeto.setStatus(novoStatus);
        }
        if (novoMaxMembros != null) projeto.setMaxMembros(novoMaxMembros);
        if (novoGrupoPrivado != null) projeto.setGrupoPrivado(novoGrupoPrivado);

        projetoRepository.save(projeto);
    }

    @Transactional
    public void recusarConvite(Long conviteId, Long usuarioId) {
        ConviteProjeto convite = conviteProjetoRepository.findById(conviteId)
                .orElseThrow(() -> new EntityNotFoundException("Convite não encontrado"));

        if (!convite.getUsuarioConvidado().getId().equals(usuarioId)) {
            throw new IllegalArgumentException("Usuário não autorizado a recusar este convite");
        }

        if (convite.getStatus() != ConviteProjeto.StatusConvite.PENDENTE) {
            throw new IllegalArgumentException("Convite não está pendente");
        }

        // Recusar convite
        convite.setStatus(ConviteProjeto.StatusConvite.RECUSADO);
        convite.setDataResposta(LocalDateTime.now());
        conviteProjetoRepository.save(convite);

        String mensagem = String.format("%s recusou o convite para o projeto '%s'.", convite.getUsuarioConvidado().getNome(), convite.getProjeto().getTitulo());
        // Notificar quem convidou
        notificacaoService.criarNotificacao(convite.getConvidadoPor(), mensagem, "CONVITE_RECUSADO", convite.getProjeto().getId());
    }

    private boolean isAdminOuModerador(Long projetoId, Long usuarioId) {
        // Verificar se é o criador do projeto
        Projeto projeto = projetoRepository.findById(projetoId).orElse(null);
        if (projeto != null && projeto.getAutor() != null && projeto.getAutor().getId().equals(usuarioId)) {
            return true;
        }

        // Verificar se tem role de ADMIN ou MODERADOR
        ProjetoMembro membro = projetoMembroRepository.findByProjetoIdAndUsuarioId(projetoId, usuarioId).orElse(null);
        return membro != null && (membro.getRole() == ProjetoMembro.RoleMembro.ADMIN ||
                membro.getRole() == ProjetoMembro.RoleMembro.MODERADOR);
    }

    @Transactional
    public void deletar(Long id, Long adminId) {
        Projeto projeto = projetoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Projeto não encontrado com id: " + id));

        // Verificar se o usuário é admin do projeto
        if (!isAdmin(id, adminId)) {
            throw new IllegalArgumentException("Apenas administradores podem deletar o projeto");
        }

        // Deletar o projeto (cascade irá remover membros automaticamente)
        projetoRepository.deleteById(id);

        System.out.println("[DEBUG] Projeto deletado com sucesso");
    }

    private ProjetoDTO converterParaDTO(Projeto projeto) {
        ProjetoDTO dto = new ProjetoDTO();

        dto.setId(projeto.getId());
        dto.setTitulo(projeto.getTitulo());
        dto.setDescricao(projeto.getDescricao());
        dto.setDataInicio(projeto.getDataInicio());
        dto.setDataEntrega(projeto.getDataEntrega());
        dto.setStatus(projeto.getStatus());

        String nomeFoto = projeto.getImagemUrl();
        if (nomeFoto != null && !nomeFoto.isBlank()) {
            dto.setImagemUrl(nomeFoto);
        } else {
            dto.setImagemUrl("/images/default-project.jpg");
        }

        dto.setDataCriacao(projeto.getDataCriacao());
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
            membroDTO.setUsuarioFotoPerfil(membro.getUsuario().getFotoPerfil());
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
            convitesPendentes = List.of();
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
}