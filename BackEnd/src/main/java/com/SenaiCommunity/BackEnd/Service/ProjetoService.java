package com.SenaiCommunity.BackEnd.Service;

import com.SenaiCommunity.BackEnd.DTO.ProjetoDTO;
import com.SenaiCommunity.BackEnd.Entity.*;
import com.SenaiCommunity.BackEnd.Repository.*;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.util.StringUtils;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ProjetoService {

    private static final String UPLOAD_DIR = "uploads/projeto-pictures/";

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

    private Usuario getUsuarioFromEmail(String email) {
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado com email: " + email));
    }

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
                String fileName = salvarFoto(foto);
                projeto.setImagemUrl(fileName);

            } catch (IOException e) {
                System.err.println("[ERROR] Erro ao salvar a foto do projeto: " + e.getMessage());
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

        Usuario autor = usuarioRepository.findById(dto.getAutorId())
                .orElseThrow(() -> new EntityNotFoundException("Autor não encontrado com id: " + dto.getAutorId()));
        projeto.setAutor(autor);


        // 1. Valida se o autor é do tipo Aluno ou Professor
        if (isNovoGrupo) { // Só valida na criação
            if (!(autor instanceof Professor) && !(autor instanceof Aluno)) {
                throw new IllegalArgumentException("O criador do projeto (autor) deve ser um Aluno ou um Professor.");
            }
        }

        // 2. Garante que as listas não sejam nulas e sejam mutáveis (para podermos remover o autor)
        List<Long> professorIds = (dto.getProfessorIds() != null) ? new ArrayList<>(dto.getProfessorIds()) : new ArrayList<>();
        List<Long> alunoIds = (dto.getAlunoIds() != null) ? new ArrayList<>(dto.getAlunoIds()) : new ArrayList<>();

        // 3. Remove o ID do autor das listas de convite, pois ele já será o Admin
        professorIds.remove(autor.getId());
        alunoIds.remove(autor.getId());

        // 4. Atualiza o DTO com as listas "limpas" (sem o autor)
        dto.setProfessorIds(professorIds);
        dto.setAlunoIds(alunoIds);

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
            // 1. Adiciona o autor como ADMIN
            adicionarMembroComoAdmin(salvo, autor);

            // 2. Envia convites apenas para os IDs restantes nas listas (pois o autor foi removido)
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
        Integer maxMembros = projeto.getMaxMembros() != null ? projeto.getMaxMembros() : 50;
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
        Integer maxMembros = convite.getProjeto().getMaxMembros() != null ? convite.getProjeto().getMaxMembros() : 50;
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

        String mensagem = String.format("%s aceitou seu convite para o projeto '%s'.", convite.getUsuarioConvidado().getNome(), convite.getProjeto().getTitulo());
        notificacaoService.criarNotificacao(convite.getConvidadoPor(), mensagem, "MEMBRO_ADICIONADO", convite.getProjeto().getId());
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

    @Transactional(readOnly = true)
    public List<Map<String, Object>> buscarConvitesRecebidos(String email) {
        Usuario usuario = getUsuarioFromEmail(email);
        List<ConviteProjeto> convites = conviteProjetoRepository.findByUsuarioConvidadoIdAndStatus(
                usuario.getId(), ConviteProjeto.StatusConvite.PENDENTE);

        return convites.stream().map(convite -> {
            Map<String, Object> map = new HashMap<>();
            map.put("conviteId", convite.getId());
            map.put("projetoId", convite.getProjeto().getId());
            map.put("nomeProjeto", convite.getProjeto().getTitulo());
            map.put("convidadoPorNome", convite.getConvidadoPor().getNome());
            map.put("dataConvite", convite.getDataConvite());
            return map;
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> buscarConvitesEnviados(String email) {
        Usuario usuario = getUsuarioFromEmail(email);
        List<ConviteProjeto> convites = conviteProjetoRepository.findByConvidadoPorIdAndStatus(
                usuario.getId(), ConviteProjeto.StatusConvite.PENDENTE);

        return convites.stream().map(convite -> {
            Map<String, Object> map = new HashMap<>();
            map.put("conviteId", convite.getId());
            map.put("projetoId", convite.getProjeto().getId());
            map.put("nomeProjeto", convite.getProjeto().getTitulo());
            map.put("convidadoNome", convite.getUsuarioConvidado().getNome());
            map.put("convidadoEmail", convite.getUsuarioConvidado().getEmail());
            map.put("dataConvite", convite.getDataConvite());
            return map;
        }).collect(Collectors.toList());
    }

    @Transactional
    public void expulsarMembro(Long projetoId, Long membroId, Long adminId) {
        if (!isAdminOuModerador(projetoId, adminId)) {
            throw new IllegalArgumentException("Apenas administradores e moderadores podem expulsar membros");
        }
        ProjetoMembro membro = projetoMembroRepository.findByProjetoIdAndUsuarioId(projetoId, membroId)
                .orElseThrow(() -> new EntityNotFoundException("Membro não encontrado no projeto"));
        Projeto projeto = projetoRepository.findById(projetoId).orElseThrow(() -> new EntityNotFoundException("Projeto não encontrado"));
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
        Projeto projeto = projetoRepository.findById(projetoId).orElseThrow(() -> new EntityNotFoundException("Projeto não encontrado"));
        if (!projeto.getAutor().getId().equals(adminId)) {
            throw new IllegalArgumentException("Apenas o criador do projeto pode alterar permissões");
        }
        ProjetoMembro membro = projetoMembroRepository.findByProjetoIdAndUsuarioId(projetoId, membroId)
                .orElseThrow(() -> new EntityNotFoundException("Membro não encontrado no projeto"));

        if (membro.getUsuario().getId().equals(projeto.getAutor().getId())) {
            throw new IllegalArgumentException("Não é possível alterar a permissão do criador do projeto");
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

        String mensagem = String.format("As informações do projeto '%s' foram atualizadas.", projeto.getTitulo());
        List<ProjetoMembro> membros = projetoMembroRepository.findByProjetoId(projetoId);
        for (ProjetoMembro membro : membros) {
            if (!membro.getUsuario().getId().equals(adminId)) {
                notificacaoService.criarNotificacao(membro.getUsuario(), mensagem, "PROJETO_ATUALIZADO", projetoId);
            }
        }
    }

    @Transactional
    public void deletar(Long id, Long adminId) {
        Projeto projeto = projetoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Projeto não encontrado com id: " + id));

        if (!isAdmin(id, adminId)) {
            throw new IllegalArgumentException("Apenas administradores podem deletar o projeto");
        }

        List<ProjetoMembro> membros = projetoMembroRepository.findByProjetoId(id);
        String nomeProjetoExcluido = projeto.getTitulo();

        projetoRepository.deleteById(id);

        String mensagem = String.format("O projeto '%s' do qual você fazia parte foi excluído.", nomeProjetoExcluido);
        for (ProjetoMembro membro : membros) {
            if (!membro.getUsuario().getId().equals(adminId)) {
                notificacaoService.criarNotificacao(membro.getUsuario(), mensagem, "PROJETO_EXCLUIDO", null);
            }
        }
    }

    @Transactional
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
            membros = List.of();
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

    private String salvarFoto(MultipartFile foto) throws IOException {
        if (foto.isEmpty()) {
            throw new IOException("Arquivo de imagem está vazio");
        }

        String contentType = foto.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IOException("Arquivo deve ser uma imagem válida");
        }

        String originalFilename = foto.getOriginalFilename();
        if (originalFilename == null) {
            originalFilename = "image.jpg";
        }

        String cleanFilename = StringUtils.cleanPath(originalFilename);
        String fileName = System.currentTimeMillis() + "_" + cleanFilename;

        Path uploadPath = Paths.get(UPLOAD_DIR);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        Path filePath = uploadPath.resolve(fileName);

        try {
            Files.copy(foto.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            System.err.println("[ERROR] Erro ao salvar arquivo: " + e.getMessage());
            throw new IOException("Erro ao salvar arquivo no servidor", e);
        }

        return fileName;
    }

    private boolean isAdmin(Long projetoId, Long usuarioId) {
        Projeto projeto = projetoRepository.findById(projetoId).orElse(null);
        if (projeto != null && projeto.getAutor() != null && projeto.getAutor().getId().equals(usuarioId)) {
            return true;
        }

        ProjetoMembro membro = projetoMembroRepository.findByProjetoIdAndUsuarioId(projetoId, usuarioId).orElse(null);
        return membro != null && membro.getRole() == ProjetoMembro.RoleMembro.ADMIN;
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

    private void adicionarMembroComoAdmin(Projeto projeto, Usuario usuario) {
        ProjetoMembro membro = new ProjetoMembro();
        membro.setProjeto(projeto);
        membro.setUsuario(usuario);
        membro.setRole(ProjetoMembro.RoleMembro.ADMIN);
        membro.setDataEntrada(LocalDateTime.now());
        projetoMembroRepository.save(membro);
    }
}