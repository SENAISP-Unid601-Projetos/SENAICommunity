package com.SenaiCommunity.BackEnd.Service;

import com.SenaiCommunity.BackEnd.DTO.ProjetoDTO;
import com.SenaiCommunity.BackEnd.DTO.SolicitacaoEntradaDTO;
import com.SenaiCommunity.BackEnd.Entity.*;
import com.SenaiCommunity.BackEnd.Exception.ConteudoImproprioException;
import com.SenaiCommunity.BackEnd.Repository.*;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;
import java.util.Map;
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

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private SolicitacaoEntradaRepository solicitacaoEntradaRepository;

    @Autowired
    private UsuarioService usuarioService; // 1. INJEÇÃO NECESSÁRIA


    // Método auxiliar para notificar atualizações em tempo real
    private void notificarAtualizacaoProjeto(Long projetoId, String tipo) {
        try {
            messagingTemplate.convertAndSend("/topic/grupo/" + projetoId,
                    Map.of("tipo", tipo, "projetoId", projetoId));
        } catch (Exception e) {
            System.err.println("Erro ao enviar notificação de atualização via WebSocket: " + e.getMessage());
        }
    }

    @Transactional
    public void solicitarEntrada(Long projetoId, Long usuarioId) {
        Projeto projeto = projetoRepository.findById(projetoId)
                .orElseThrow(() -> new EntityNotFoundException("Projeto não encontrado"));

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado"));

        if (!projeto.getGrupoPrivado()) {
            throw new IllegalArgumentException("Este projeto é público. Você pode entrar diretamente sem solicitar.");
        }

        if (projetoMembroRepository.existsByProjetoIdAndUsuarioId(projetoId, usuarioId)) {
            throw new IllegalArgumentException("Você já é membro deste projeto.");
        }

        if (solicitacaoEntradaRepository.existsByProjetoIdAndUsuarioSolicitanteIdAndStatus(
                projetoId, usuarioId, SolicitacaoEntrada.StatusSolicitacao.PENDENTE)) {
            throw new IllegalArgumentException("Você já enviou uma solicitação para este projeto. Aguarde a aprovação.");
        }

        SolicitacaoEntrada solicitacao = new SolicitacaoEntrada();
        solicitacao.setProjeto(projeto);
        solicitacao.setUsuarioSolicitante(usuario);
        solicitacao.setDataSolicitacao(LocalDateTime.now());
        solicitacao.setStatus(SolicitacaoEntrada.StatusSolicitacao.PENDENTE);

        solicitacaoEntradaRepository.save(solicitacao);

        String mensagem = String.format("%s solicitou entrada no seu projeto privado '%s'.",
                usuario.getNome(), projeto.getTitulo());

        notificacaoService.criarNotificacao(projeto.getAutor(), mensagem, "SOLICITACAO_ENTRADA", projeto.getId());

        notificarAtualizacaoProjeto(projetoId, "nova_solicitacao");
    }

    @Transactional
    public void cancelarSolicitacao(Long solicitacaoId, Long usuarioId) {
        SolicitacaoEntrada solicitacao = solicitacaoEntradaRepository.findById(solicitacaoId)
                .orElseThrow(() -> new EntityNotFoundException("Solicitação não encontrada"));

        if (!solicitacao.getUsuarioSolicitante().getId().equals(usuarioId)) {
            throw new IllegalArgumentException("Você só pode cancelar suas próprias solicitações.");
        }

        if (solicitacao.getStatus() != SolicitacaoEntrada.StatusSolicitacao.PENDENTE) {
            throw new IllegalArgumentException("Só é possível cancelar solicitações pendentes.");
        }

        solicitacaoEntradaRepository.delete(solicitacao);

        notificarAtualizacaoProjeto(solicitacao.getProjeto().getId(), "nova_solicitacao");
    }

    @Transactional
    public void sairDoProjeto(Long projetoId, Long usuarioId) {
        Projeto projeto = projetoRepository.findById(projetoId)
                .orElseThrow(() -> new EntityNotFoundException("Projeto não encontrado"));

        ProjetoMembro membro = projetoMembroRepository.findByProjetoIdAndUsuarioId(projetoId, usuarioId)
                .orElseThrow(() -> new IllegalArgumentException("Você não é membro deste projeto."));

        if (projeto.getAutor().getId().equals(usuarioId)) {
            throw new IllegalArgumentException("O dono do projeto não pode sair. Delete o projeto ou transfira a propriedade.");
        }

        projetoMembroRepository.delete(membro);

        String mensagem = String.format("%s saiu do projeto '%s'.", membro.getUsuario().getNome(), projeto.getTitulo());
        notificacaoService.criarNotificacao(projeto.getAutor(), mensagem, "MEMBRO_SAIU", projeto.getId());

        usuarioService.notificarAtualizacaoPerfil(membro.getUsuario());
        notificarAtualizacaoProjeto(projetoId, "membros_atualizados");
    }

    public List<SolicitacaoEntradaDTO> listarSolicitacoesPendentes(Long projetoId, Long usuarioLogadoId) {
        if (!isAdminOuModerador(projetoId, usuarioLogadoId)) {
            throw new IllegalArgumentException("Sem permissão para visualizar solicitações.");
        }

        List<SolicitacaoEntrada> solicitacoes = solicitacaoEntradaRepository
                .findByProjetoIdAndStatus(projetoId, SolicitacaoEntrada.StatusSolicitacao.PENDENTE);

        return solicitacoes.stream().map(s -> {
            SolicitacaoEntradaDTO dto = new SolicitacaoEntradaDTO();
            dto.setId(s.getId());
            dto.setUsuarioId(s.getUsuarioSolicitante().getId());
            dto.setUsuarioNome(s.getUsuarioSolicitante().getNome());
            dto.setUsuarioEmail(s.getUsuarioSolicitante().getEmail());
            dto.setUsuarioFoto(s.getUsuarioSolicitante().getFotoPerfil());
            dto.setDataSolicitacao(s.getDataSolicitacao());
            dto.setStatus(s.getStatus().toString());
            return dto;
        }).collect(Collectors.toList());
    }

    @Transactional
    public void aprovarSolicitacaoEntrada(Long solicitacaoId, Long usuarioLogadoId) {
        SolicitacaoEntrada solicitacao = solicitacaoEntradaRepository.findById(solicitacaoId)
                .orElseThrow(() -> new EntityNotFoundException("Solicitação não encontrada"));

        if (!isAdminOuModerador(solicitacao.getProjeto().getId(), usuarioLogadoId)) {
            throw new IllegalArgumentException("Você não tem permissão para aprovar membros neste projeto.");
        }

        if (solicitacao.getStatus() != SolicitacaoEntrada.StatusSolicitacao.PENDENTE) {
            throw new IllegalArgumentException("Esta solicitação não está pendente.");
        }

        Projeto projeto = solicitacao.getProjeto();

        Integer totalMembros = projetoMembroRepository.countMembrosByProjetoId(projeto.getId());
        if (totalMembros == null) totalMembros = 0;
        Integer maxMembros = projeto.getMaxMembros() != null ? projeto.getMaxMembros() : 50;

        if (totalMembros >= maxMembros) {
            throw new IllegalArgumentException("O projeto já atingiu o limite máximo de membros.");
        }

        solicitacao.setStatus(SolicitacaoEntrada.StatusSolicitacao.ACEITO);
        solicitacaoEntradaRepository.save(solicitacao);

        ProjetoMembro novoMembro = new ProjetoMembro();
        novoMembro.setProjeto(projeto);
        novoMembro.setUsuario(solicitacao.getUsuarioSolicitante());
        novoMembro.setRole(ProjetoMembro.RoleMembro.MEMBRO);
        novoMembro.setDataEntrada(LocalDateTime.now());
        Usuario quemAprovou = usuarioRepository.findById(usuarioLogadoId).orElse(projeto.getAutor());
        novoMembro.setConvidadoPor(quemAprovou);

        projetoMembroRepository.save(novoMembro);

        String mensagem = String.format("Sua solicitação para entrar no projeto '%s' foi aprovada!", projeto.getTitulo());
        notificacaoService.criarNotificacao(solicitacao.getUsuarioSolicitante(), mensagem, "SOLICITACAO_ACEITA", projeto.getId());
        usuarioService.notificarAtualizacaoPerfil(novoMembro.getUsuario());
        notificarAtualizacaoProjeto(projeto.getId(), "membros_atualizados");
    }

    @Transactional
    public void recusarSolicitacaoEntrada(Long solicitacaoId, Long usuarioLogadoId) {
        SolicitacaoEntrada solicitacao = solicitacaoEntradaRepository.findById(solicitacaoId)
                .orElseThrow(() -> new EntityNotFoundException("Solicitação não encontrada"));

        if (!isAdminOuModerador(solicitacao.getProjeto().getId(), usuarioLogadoId)) {
            throw new IllegalArgumentException("Você não tem permissão para gerenciar este projeto.");
        }

        if (solicitacao.getStatus() != SolicitacaoEntrada.StatusSolicitacao.PENDENTE) {
            throw new IllegalArgumentException("Esta solicitação não está pendente.");
        }

        solicitacao.setStatus(SolicitacaoEntrada.StatusSolicitacao.RECUSADO);
        solicitacaoEntradaRepository.save(solicitacao);

        String mensagem = String.format("Sua solicitação para entrar no projeto '%s' foi recusada.", solicitacao.getProjeto().getTitulo());
        notificacaoService.criarNotificacao(solicitacao.getUsuarioSolicitante(), mensagem, "SOLICITACAO_RECUSADA", solicitacao.getProjeto().getId());
    }

    public List<ProjetoDTO> listarTodos() {
        List<Projeto> projetos = projetoRepository.findAll();
        return projetos.stream().map(this::converterParaDTO).collect(Collectors.toList());
    }

    public List<ProjetoDTO> listarProjetosPrivados() {
        List<Projeto> projetos = projetoRepository.findByGrupoPrivadoTrue();
        return projetos.stream().map(this::converterParaDTO).collect(Collectors.toList());
    }

    public List<ProjetoDTO> listarProjetosDoUsuario(Long usuarioId) {
        List<ProjetoMembro> membros = projetoMembroRepository.findByUsuarioId(usuarioId);
        return membros.stream().map(ProjetoMembro::getProjeto).map(this::converterParaDTO).collect(Collectors.toList());
    }

    public ProjetoDTO buscarPorId(Long id) {
        Projeto projeto = projetoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Projeto não encontrado com id: " + id));
        return converterParaDTO(projeto);
    }

    public List<ProjetoDTO> listarProjetosPublicos() {
        List<Projeto> projetos = projetoRepository.findByGrupoPrivadoFalse();
        return projetos.stream().map(this::converterParaDTO).collect(Collectors.toList());
    }

    @Transactional
    public void entrarEmProjetoPublico(Long projetoId, Long usuarioId) {
        Projeto projeto = projetoRepository.findById(projetoId)
                .orElseThrow(() -> new EntityNotFoundException("Projeto não encontrado"));

        if (projeto.getGrupoPrivado()) {
            throw new IllegalArgumentException("Este projeto é privado. É necessário um convite.");
        }

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado"));

        if (projetoMembroRepository.existsByProjetoIdAndUsuarioId(projetoId, usuarioId)) {
            throw new IllegalArgumentException("Usuário já é membro do projeto");
        }

        Integer totalMembros = projetoMembroRepository.countMembrosByProjetoId(projetoId);
        if (totalMembros == null) totalMembros = 0;

        Integer maxMembros = projeto.getMaxMembros();
        if (maxMembros == null) maxMembros = 50;

        if (totalMembros >= maxMembros) {
            throw new IllegalArgumentException("Projeto atingiu o limite máximo de membros");
        }

        ProjetoMembro membro = new ProjetoMembro();
        membro.setProjeto(projeto);
        membro.setUsuario(usuario);
        membro.setRole(ProjetoMembro.RoleMembro.MEMBRO);
        membro.setDataEntrada(LocalDateTime.now());
        membro.setConvidadoPor(projeto.getAutor());

        projetoMembroRepository.save(membro);

        String mensagem = String.format("%s entrou no projeto '%s'.", usuario.getNome(), projeto.getTitulo());
        notificacaoService.criarNotificacao(projeto.getAutor(), mensagem, "MEMBRO_ADICIONADO", projeto.getId());

        usuarioService.notificarAtualizacaoPerfil(usuario);
        notificarAtualizacaoProjeto(projetoId, "membros_atualizados");
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
        projeto.setCategoria(dto.getCategoria());
        projeto.setTecnologias(dto.getTecnologias());

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
                projeto.setImagemUrl(urlCloudinary);
            } catch (IOException e) {
                e.printStackTrace();
                throw new RuntimeException("Erro ao salvar a foto do projeto", e);
            }
        } else {
            if (isNovoGrupo) {
                projeto.setImagemUrl("/images/default-project.jpg");
            }
        }

        projeto.setMaxMembros(dto.getMaxMembros() != null ? dto.getMaxMembros() : 50);
        projeto.setGrupoPrivado(dto.getGrupoPrivado() != null ? dto.getGrupoPrivado() : false);

        if (isNovoGrupo) {
            projeto.setDataCriacao(LocalDateTime.now());
        }

        Usuario autor = usuarioRepository.findById(dto.getAutorId())
                .orElseThrow(() -> new EntityNotFoundException("Autor não encontrado com id: " + dto.getAutorId()));
        projeto.setAutor(autor);

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
        } else {
            notificarAtualizacaoProjeto(salvo.getId(), "projeto_atualizado");
        }

        return converterParaDTO(salvo);
    }

    private void enviarConvitesAutomaticos(Projeto projeto, List<Long> professorIds, List<Long> alunoIds, Long autorId) {
        if (professorIds != null) {
            for (Long professorId : professorIds) {
                try {
                    enviarConvite(projeto.getId(), professorId, autorId);
                } catch (Exception e) {
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

        if (projetoMembroRepository.existsByProjetoIdAndUsuarioId(projetoId, usuarioConvidadoId)) {
            throw new IllegalArgumentException("Usuário já é membro do grupo");
        }

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

        convite.setStatus(ConviteProjeto.StatusConvite.ACEITO);
        convite.setDataResposta(LocalDateTime.now());
        conviteProjetoRepository.save(convite);

        ProjetoMembro membro = new ProjetoMembro();
        membro.setProjeto(convite.getProjeto());
        membro.setUsuario(convite.getUsuarioConvidado());
        membro.setRole(ProjetoMembro.RoleMembro.MEMBRO);
        membro.setDataEntrada(LocalDateTime.now());
        membro.setConvidadoPor(convite.getConvidadoPor());

        projetoMembroRepository.save(membro);

        String mensagem = String.format("%s aceitou seu convite e agora faz parte do projeto '%s'.", convite.getUsuarioConvidado().getNome(), convite.getProjeto().getTitulo());
        notificacaoService.criarNotificacao(convite.getProjeto().getAutor(), mensagem, "MEMBRO_ADICIONADO", convite.getProjeto().getId());

        notificarAtualizacaoProjeto(convite.getProjeto().getId(), "membros_atualizados");
    }

    @Transactional
    public void expulsarMembro(Long projetoId, Long membroId, Long adminId) {
        if (!isAdminOuModerador(projetoId, adminId)) {
            throw new IllegalArgumentException("Apenas administradores e moderadores podem expulsar membros");
        }

        ProjetoMembro membro = projetoMembroRepository.findByProjetoIdAndUsuarioId(projetoId, membroId)
                .orElseThrow(() -> new EntityNotFoundException("Membro não encontrado no projeto"));

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
        usuarioService.notificarAtualizacaoPerfil(membro.getUsuario());
        notificarAtualizacaoProjeto(projetoId, "membros_atualizados");
    }

    @Transactional
    public void alterarPermissao(Long projetoId, Long membroId, ProjetoMembro.RoleMembro novaRole, Long adminId) {
        Projeto projeto = projetoRepository.findById(projetoId).orElseThrow();
        if (!projeto.getAutor().getId().equals(adminId)) {
            throw new IllegalArgumentException("Apenas o criador do projeto pode alterar permissões");
        }

        ProjetoMembro membro = projetoMembroRepository.findByProjetoIdAndUsuarioId(projetoId, membroId)
                .orElseThrow(() -> new EntityNotFoundException("Membro não encontrado no projeto"));

        if (membro.getUsuario().getId().equals(projeto.getAutor().getId())) {
            throw new IllegalArgumentException("Não é possível alterar permissão do criador do projeto");
        }

        membro.setRole(novaRole);
        projetoMembroRepository.save(membro);

        String mensagem = String.format("Sua permissão no projeto '%s' foi alterada para %s.", projeto.getTitulo(), novaRole.toString());
        notificacaoService.criarNotificacao(membro.getUsuario(), mensagem, "PERMISSAO_ALTERADA", projeto.getId());

        notificarAtualizacaoProjeto(projetoId, "membros_atualizados");
    }

    @Transactional
    public void atualizarInfoGrupo(Long projetoId, String novoTitulo, String novaDescricao, String novaImagemUrl,
                                   String novoStatus, Integer novoMaxMembros, Boolean novoGrupoPrivado,
                                   String novaCategoria, List<String> novasTecnologias, Long adminId) {
        if (!isAdmin(projetoId, adminId)) {
            throw new IllegalArgumentException("Apenas administradores podem alterar informações do grupo");
        }

        Projeto projeto = projetoRepository.findById(projetoId)
                .orElseThrow(() -> new EntityNotFoundException("Projeto não encontrado"));

        if (novoTitulo != null) projeto.setTitulo(novoTitulo);
        if (novaDescricao != null) projeto.setDescricao(novaDescricao);
        if (novaImagemUrl != null) projeto.setImagemUrl(novaImagemUrl);

        // --- CORREÇÃO AQUI: Aceitar com e sem acento ---
        if (novoStatus != null) {
            if (novoStatus.equalsIgnoreCase("Em planejamento") ||
                    novoStatus.equalsIgnoreCase("Em progresso") ||
                    novoStatus.equalsIgnoreCase("Concluido") ||
                    novoStatus.equalsIgnoreCase("Concluído")) {

                // Se for "Concluído" (com acento), salva como "Concluido" ou mantém,
                // dependendo de como você quer no banco. Vou manter o original "Concluido" (sem acento)
                // se vier com acento, para padronizar.
                if (novoStatus.equalsIgnoreCase("Concluído")) {
                    projeto.setStatus("Concluido");
                } else {
                    projeto.setStatus(novoStatus);
                }
            } else {
                throw new IllegalArgumentException("Status deve ser: Em planejamento, Em progresso ou Concluído");
            }
        }

        if (novoMaxMembros != null) projeto.setMaxMembros(novoMaxMembros);
        if (novoGrupoPrivado != null) projeto.setGrupoPrivado(novoGrupoPrivado);
        if (novaCategoria != null) projeto.setCategoria(novaCategoria);
        if (novasTecnologias != null) projeto.setTecnologias(novasTecnologias);

        projetoRepository.save(projeto);

        notificarAtualizacaoProjeto(projetoId, "projeto_atualizado");
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

        convite.setStatus(ConviteProjeto.StatusConvite.RECUSADO);
        convite.setDataResposta(LocalDateTime.now());
        conviteProjetoRepository.save(convite);

        String mensagem = String.format("%s recusou o convite para o projeto '%s'.", convite.getUsuarioConvidado().getNome(), convite.getProjeto().getTitulo());
        notificacaoService.criarNotificacao(convite.getConvidadoPor(), mensagem, "CONVITE_RECUSADO", convite.getProjeto().getId());
    }

    private boolean isAdminOuModerador(Long projetoId, Long usuarioId) {
        Projeto projeto = projetoRepository.findById(projetoId).orElse(null);
        if (projeto != null && projeto.getAutor() != null && projeto.getAutor().getId().equals(usuarioId)) {
            return true;
        }

        ProjetoMembro membro = projetoMembroRepository.findByProjetoIdAndUsuarioId(projetoId, usuarioId).orElse(null);
        return membro != null && (membro.getRole() == ProjetoMembro.RoleMembro.ADMIN ||
                membro.getRole() == ProjetoMembro.RoleMembro.MODERADOR);
    }

    @Transactional
    public void deletar(Long id, Long adminId) {
        Projeto projeto = projetoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Projeto não encontrado com id: " + id));

        if (!isAdmin(id, adminId)) {
            throw new IllegalArgumentException("Apenas administradores podem deletar o projeto");
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
        dto.setCategoria(projeto.getCategoria());
        dto.setTecnologias(projeto.getTecnologias());

        String nomeFoto = projeto.getImagemUrl();
        if (nomeFoto != null && !nomeFoto.isBlank()) {
            dto.setImagemUrl(nomeFoto);
        } else {
            dto.setImagemUrl("/images/default-project.jpg");
        }

        dto.setDataCriacao(projeto.getDataCriacao());
        dto.setMaxMembros(projeto.getMaxMembros());
        dto.setGrupoPrivado(projeto.getGrupoPrivado());

        dto.setAutorId(projeto.getAutor() != null ? projeto.getAutor().getId() : null);
        dto.setAutorNome(projeto.getAutor() != null ? projeto.getAutor().getNome() : null);

        if (projeto.getProfessores() != null) {
            dto.setProfessorIds(projeto.getProfessores().stream().map(Professor::getId).collect(Collectors.toList()));
        }
        if (projeto.getAlunos() != null) {
            dto.setAlunoIds(projeto.getAlunos().stream().map(Aluno::getId).collect(Collectors.toList()));
        }

        List<ProjetoMembro> membros;
        try {
            membros = projetoMembroRepository.findByProjetoId(projeto.getId());
        } catch (Exception e) {
            membros = List.of();
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
        Projeto projeto = projetoRepository.findById(projetoId).orElse(null);
        if (projeto != null && projeto.getAutor() != null && projeto.getAutor().getId().equals(usuarioId)) {
            return true;
        }
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