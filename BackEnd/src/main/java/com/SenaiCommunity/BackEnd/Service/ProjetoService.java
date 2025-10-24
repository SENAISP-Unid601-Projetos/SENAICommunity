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
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProjetoService {

    private static final String UPLOAD_DIR = "uploads/projeto-pictures/";

    @Autowired
    private ProjetoRepository projetoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    // Removido Professor/Aluno Repository, pois agora usamos ProjetoMembro
    // @Autowired
    // private ProfessorRepository professorRepository;
    // @Autowired
    // private AlunoRepository alunoRepository;

    @Autowired
    private ProjetoMembroRepository projetoMembroRepository;

    @Autowired
    private ConviteProjetoRepository conviteProjetoRepository;

    @Autowired
    private NotificacaoService notificacaoService;

    @Autowired
    private MensagemGrupoService mensagemGrupoService;

    public List<ProjetoDTO> listarTodos() {
        List<Projeto> projetos = projetoRepository.findAll();
        return projetos.stream().map(this::converterParaDTO).collect(Collectors.toList());
    }

    public ProjetoDTO buscarPorId(Long id) {
        Projeto projeto = projetoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Projeto não encontrado com id: " + id));
        return converterParaDTO(projeto);
    }

    // ✅ --- NOVO MÉTODO ADICIONADO ---
    @Transactional(readOnly = true) // Boa prática para métodos de leitura
    public List<ProjetoDTO> listarMeusProjetos(String emailUsuario) {
        Usuario usuario = usuarioRepository.findByEmail(emailUsuario)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado: " + emailUsuario));

        // 1. Encontra todas as participações (ProjetoMembro) do usuário
        List<ProjetoMembro> minhasParticipacoes = projetoMembroRepository.findByUsuarioId(usuario.getId());

        // 2. Mapeia essas participações de volta para uma lista de Projetos DTO
        return minhasParticipacoes.stream()
                .map(ProjetoMembro::getProjeto) // Pega o Projeto de cada participação
                .map(this::converterParaDTO)    // Converte o Projeto para ProjetoDTO
                .collect(Collectors.toList());
    }
    // --- FIM DO NOVO MÉTODO ---

    @Transactional
    public ProjetoDTO salvar(ProjetoDTO dto, MultipartFile foto) {
        Projeto projeto;
        boolean isNovoGrupo = dto.getId() == null;

        // Pega o autor (necessário para verificação de permissão em 'atualizar')
        Usuario autor = usuarioRepository.findById(dto.getAutorId())
                .orElseThrow(() -> new EntityNotFoundException("Autor (usuário logado) não encontrado com id: " + dto.getAutorId()));

        if (isNovoGrupo) {
            projeto = new Projeto();
            projeto.setAutor(autor);
            projeto.setDataCriacao(LocalDateTime.now());
            projeto.setDataInicio(new Date()); // Data atual automaticamente
            projeto.setStatus("Em planejamento"); // Status padrão
        } else {
            projeto = projetoRepository.findById(dto.getId())
                    .orElseThrow(() -> new EntityNotFoundException("Projeto não encontrado para atualização: " + dto.getId()));
            // Verifica permissão para editar (somente admin do projeto pode)
            if (!isAdmin(projeto.getId(), autor.getId())) {
                throw new IllegalArgumentException("Apenas administradores podem editar o projeto.");
            }
            // Campos que só podem ser atualizados (não definidos na criação)
            projeto.setDataInicio(dto.getDataInicio());
            projeto.setStatus(dto.getStatus());
        }

        projeto.setTitulo(dto.getTitulo());
        projeto.setDescricao(dto.getDescricao());
        projeto.setDataEntrega(dto.getDataEntrega());
        projeto.setLinksUteis(dto.getLinksUteis()); // Salva links
        projeto.setMaxMembros(dto.getMaxMembros() != null ? dto.getMaxMembros() : 50);
        projeto.setGrupoPrivado(dto.getGrupoPrivado() != null ? dto.getGrupoPrivado() : false);

        // Lógica da Foto
        if (foto != null && !foto.isEmpty()) {
            try {
                // Deleta foto antiga se for atualização e houver foto antiga
                if (!isNovoGrupo && projeto.getImagemUrl() != null && !projeto.getImagemUrl().isBlank()) {
                    deletarFotoAntiga(projeto.getImagemUrl());
                }
                String fileName = salvarFoto(foto);
                projeto.setImagemUrl(fileName);
            } catch (IOException e) {
                System.err.println("[ERROR] Erro ao salvar a foto do projeto: " + e.getMessage());
                // Não lança exceção fatal, apenas loga.
            }
        } else if (dto.getImagemUrl() != null && dto.getImagemUrl().isEmpty() && projeto.getImagemUrl() != null) {
            // Se a URL veio vazia (indicando remoção) e existia uma foto antes
            deletarFotoAntiga(projeto.getImagemUrl());
            projeto.setImagemUrl(null);
        } // Se não enviar foto nem URL, mantém a imagem existente

        Projeto salvo = projetoRepository.save(projeto);

        if (isNovoGrupo) {
            adicionarMembroComoAdmin(salvo, autor);
            enviarConvitesAutomaticos(salvo, dto.getProfessorIds(), dto.getAlunoIds(), autor.getId());

            // --- LÓGICA DE CRIAÇÃO DE CHAT ---
            List<Long> todosIdsConvidados = new ArrayList<>();
            if (dto.getProfessorIds() != null) todosIdsConvidados.addAll(dto.getProfessorIds());
            if (dto.getAlunoIds() != null) todosIdsConvidados.addAll(dto.getAlunoIds());
            todosIdsConvidados.remove(autor.getId()); // Remove o próprio autor da contagem de convidados

            if (todosIdsConvidados.isEmpty()) {
                mensagemGrupoService.criarMensagemDeSistema(salvo,
                        "Bem-vindo ao chat do seu novo projeto! Adicione participantes ao projeto para começar a conversar.");
            } else {
                mensagemGrupoService.criarMensagemDeSistema(salvo,
                        "Chat do projeto '" + salvo.getTitulo() + "' criado. Convites enviados para " + todosIdsConvidados.size() + " membro(s).");
            }
        }

        return converterParaDTO(salvo);
    }

    // Método auxiliar para deletar foto antiga
    private void deletarFotoAntiga(String nomeArquivo) {
        if (nomeArquivo == null || nomeArquivo.isBlank()) return;
        try {
            Path filePath = Paths.get(UPLOAD_DIR).resolve(nomeArquivo).normalize();
            Files.deleteIfExists(filePath);
            System.out.println("[DEBUG] Foto antiga deletada: " + nomeArquivo);
        } catch (IOException e) {
            System.err.println("[WARN] Não foi possível deletar a foto antiga " + nomeArquivo + ": " + e.getMessage());
        }
    }


    private void enviarConvitesAutomaticos(Projeto projeto, List<Long> professorIds, List<Long> alunoIds, Long autorId) {
        if (professorIds != null) {
            for (Long professorId : professorIds) {
                try {
                    if (!professorId.equals(autorId)) { // Não convida o próprio autor
                        enviarConvite(projeto.getId(), professorId, autorId);
                    }
                } catch (Exception e) {
                    System.err.println("[WARN] Erro ao enviar convite automático para professor " + professorId + ": " + e.getMessage());
                }
            }
        }

        if (alunoIds != null) {
            for (Long alunoId : alunoIds) {
                try {
                    if (!alunoId.equals(autorId)) { // Não convida o próprio autor
                        enviarConvite(projeto.getId(), alunoId, autorId);
                    }
                } catch (Exception e) {
                    System.err.println("[WARN] Erro ao enviar convite automático para aluno " + alunoId + ": " + e.getMessage());
                }
            }
        }
    }

    @Transactional
    public void enviarConvite(Long projetoId, Long usuarioConvidadoId, Long usuarioConvidadorId) {
        Projeto projeto = projetoRepository.findById(projetoId)
                .orElseThrow(() -> new EntityNotFoundException("Projeto não encontrado: " + projetoId));
        Usuario usuarioConvidado = usuarioRepository.findById(usuarioConvidadoId)
                .orElseThrow(() -> new EntityNotFoundException("Usuário convidado não encontrado: " + usuarioConvidadoId));
        Usuario usuarioConvidador = usuarioRepository.findById(usuarioConvidadorId)
                .orElseThrow(() -> new EntityNotFoundException("Usuário convidador não encontrado: " + usuarioConvidadorId));

        if (!isAdminOuModerador(projetoId, usuarioConvidadorId)) {
            throw new IllegalArgumentException("Apenas administradores ou moderadores podem enviar convites.");
        }
        if (projetoMembroRepository.existsByProjetoIdAndUsuarioId(projetoId, usuarioConvidadoId)) {
            throw new IllegalArgumentException("Usuário já é membro deste projeto.");
        }
        if (conviteProjetoRepository.existsByProjetoIdAndUsuarioConvidadoIdAndStatus(projetoId, usuarioConvidadoId, ConviteProjeto.StatusConvite.PENDENTE)) {
            throw new IllegalArgumentException("Já existe um convite pendente para este usuário neste projeto.");
        }

        Integer totalMembros = projetoMembroRepository.countMembrosByProjetoId(projetoId);
        Integer maxMembros = projeto.getMaxMembros() != null ? projeto.getMaxMembros() : 50;
        if (totalMembros >= maxMembros) {
            throw new IllegalArgumentException("O projeto atingiu o limite máximo de " + maxMembros + " membros.");
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
                .orElseThrow(() -> new EntityNotFoundException("Convite não encontrado: " + conviteId));
        if (!convite.getUsuarioConvidado().getId().equals(usuarioId)) {
            throw new IllegalArgumentException("Este convite não é para você.");
        }
        if (convite.getStatus() != ConviteProjeto.StatusConvite.PENDENTE) {
            throw new IllegalArgumentException("Este convite já foi respondido (" + convite.getStatus() + ").");
        }
        Integer totalMembros = projetoMembroRepository.countMembrosByProjetoId(convite.getProjeto().getId());
        Integer maxMembros = convite.getProjeto().getMaxMembros() != null ? convite.getProjeto().getMaxMembros() : 50;
        if (totalMembros >= maxMembros) {
            convite.setStatus(ConviteProjeto.StatusConvite.RECUSADO);
            convite.setDataResposta(LocalDateTime.now());
            conviteProjetoRepository.save(convite);
            throw new IllegalArgumentException("O projeto atingiu o limite máximo de membros ("+ maxMembros +") enquanto o convite estava pendente.");
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

        String mensagemNotificacao = String.format("%s aceitou seu convite para o projeto '%s'.", convite.getUsuarioConvidado().getNome(), convite.getProjeto().getTitulo());
        notificacaoService.criarNotificacao(convite.getConvidadoPor(), mensagemNotificacao, "CONVITE_ACEITO", convite.getProjeto().getId());
    }

    @Transactional
    public void recusarConvite(Long conviteId, Long usuarioId) {
        ConviteProjeto convite = conviteProjetoRepository.findById(conviteId)
                .orElseThrow(() -> new EntityNotFoundException("Convite não encontrado: " + conviteId));

        if (convite.getUsuarioConvidado().getId().equals(usuarioId)) {
            if (convite.getStatus() != ConviteProjeto.StatusConvite.PENDENTE) {
                throw new IllegalArgumentException("Este convite já foi respondido (" + convite.getStatus() + ").");
            }
            convite.setStatus(ConviteProjeto.StatusConvite.RECUSADO);
            convite.setDataResposta(LocalDateTime.now());
            conviteProjetoRepository.save(convite);
            String msg = String.format("%s recusou seu convite para o projeto '%s'.", convite.getUsuarioConvidado().getNome(), convite.getProjeto().getTitulo());
            notificacaoService.criarNotificacao(convite.getConvidadoPor(), msg, "CONVITE_RECUSADO", convite.getProjeto().getId());

        } else if (convite.getConvidadoPor() != null && convite.getConvidadoPor().getId().equals(usuarioId)) {
            if (convite.getStatus() != ConviteProjeto.StatusConvite.PENDENTE) {
                throw new IllegalArgumentException("Você não pode cancelar um convite que já foi respondido.");
            }
            convite.setStatus(ConviteProjeto.StatusConvite.CANCELADO); // Usa o enum correto
            convite.setDataResposta(LocalDateTime.now());
            conviteProjetoRepository.save(convite);
            String msgCancelado = String.format("O convite de %s para o projeto '%s' foi cancelado.", convite.getConvidadoPor().getNome(), convite.getProjeto().getTitulo());
            notificacaoService.criarNotificacao(convite.getUsuarioConvidado(), msgCancelado, "CONVITE_CANCELADO", convite.getProjeto().getId());
        } else {
            throw new IllegalArgumentException("Você não pode recusar/cancelar este convite.");
        }
    }

    @Transactional
    public void expulsarMembro(Long projetoId, Long membroId, Long adminId) {
        if (!isAdminOuModerador(projetoId, adminId)) {
            throw new IllegalArgumentException("Apenas administradores ou moderadores podem expulsar membros.");
        }
        ProjetoMembro membroParaExpulsar = projetoMembroRepository.findByProjetoIdAndUsuarioId(projetoId, membroId)
                .orElseThrow(() -> new EntityNotFoundException("Membro não encontrado no projeto."));
        Projeto projeto = membroParaExpulsar.getProjeto();
        if (membroParaExpulsar.getUsuario().getId().equals(projeto.getAutor().getId())) {
            throw new IllegalArgumentException("Não é possível expulsar o criador do projeto.");
        }
        ProjetoMembro adminOuMod = projetoMembroRepository.findByProjetoIdAndUsuarioId(projetoId, adminId).orElse(null);
        if (adminOuMod != null && adminOuMod.getRole() == ProjetoMembro.RoleMembro.MODERADOR &&
                (membroParaExpulsar.getRole() == ProjetoMembro.RoleMembro.ADMIN || membroParaExpulsar.getUsuario().getId().equals(projeto.getAutor().getId())) ) {
            throw new IllegalArgumentException("Moderadores não podem expulsar administradores.");
        }

        projetoMembroRepository.delete(membroParaExpulsar);

        String mensagem = String.format("Você foi removido do projeto '%s'.", projeto.getTitulo());
        notificacaoService.criarNotificacao(membroParaExpulsar.getUsuario(), mensagem, "MEMBRO_REMOVIDO", projeto.getId());
    }


    @Transactional
    public void alterarPermissao(Long projetoId, Long membroId, ProjetoMembro.RoleMembro novaRole, Long adminId) {
        Projeto projeto = projetoRepository.findById(projetoId).orElseThrow(() -> new EntityNotFoundException("Projeto não encontrado"));
        if (!projeto.getAutor().getId().equals(adminId)) {
            throw new IllegalArgumentException("Apenas o criador do projeto pode alterar permissões.");
        }
        ProjetoMembro membro = projetoMembroRepository.findByProjetoIdAndUsuarioId(projetoId, membroId)
                .orElseThrow(() -> new EntityNotFoundException("Membro não encontrado no projeto."));
        if (membro.getUsuario().getId().equals(adminId)) {
            throw new IllegalArgumentException("Não é possível alterar a permissão do criador do projeto.");
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
            throw new IllegalArgumentException("Apenas administradores podem alterar informações do grupo.");
        }
        Projeto projeto = projetoRepository.findById(projetoId)
                .orElseThrow(() -> new EntityNotFoundException("Projeto não encontrado"));

        if (novoTitulo != null) projeto.setTitulo(novoTitulo);
        if (novaDescricao != null) projeto.setDescricao(novaDescricao);
        if (novaImagemUrl != null) projeto.setImagemUrl(novaImagemUrl);
        if (novoStatus != null) {
            if (!List.of("Em planejamento", "Em progresso", "Concluído").contains(novoStatus)) {
                throw new IllegalArgumentException("Status inválido. Use: Em planejamento, Em progresso ou Concluído");
            }
            projeto.setStatus(novoStatus);
        }
        if (novoMaxMembros != null) projeto.setMaxMembros(novoMaxMembros);
        if (novoGrupoPrivado != null) projeto.setGrupoPrivado(novoGrupoPrivado);

        projetoRepository.save(projeto);
    }


    @Transactional
    public void deletar(Long id, Long adminId) {
        Projeto projeto = projetoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Projeto não encontrado com id: " + id));
        if (!isAdmin(id, adminId)) {
            throw new IllegalArgumentException("Apenas administradores podem deletar o projeto.");
        }
        projetoRepository.delete(projeto); // Cascade deve cuidar do resto
        System.out.println("[DEBUG] Projeto deletado com sucesso: " + id);
    }

    // Sobrecarga mantida por segurança
    @Deprecated
    public void deletar(Long id) {
        Projeto projeto = projetoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Projeto não encontrado com id: " + id));
        // Esta versão não tem verificação de admin, é perigosa.
        // Recomenda-se usar a versão com adminId.
        projetoRepository.delete(projeto);
    }

    // Converte Entidade Projeto para ProjetoDTO
    private ProjetoDTO converterParaDTO(Projeto projeto) {
        ProjetoDTO dto = new ProjetoDTO();
        dto.setId(projeto.getId());
        dto.setTitulo(projeto.getTitulo());
        dto.setDescricao(projeto.getDescricao());
        dto.setDataInicio(projeto.getDataInicio());
        dto.setDataEntrega(projeto.getDataEntrega());
        dto.setStatus(projeto.getStatus());
        dto.setLinksUteis(projeto.getLinksUteis()); // Mapeia links
        dto.setImagemUrl(projeto.getImagemUrl()); // Passa o nome do arquivo
        dto.setDataCriacao(projeto.getDataCriacao());
        dto.setMaxMembros(projeto.getMaxMembros());
        dto.setGrupoPrivado(projeto.getGrupoPrivado());
        dto.setAutorId(projeto.getAutor() != null ? projeto.getAutor().getId() : null);
        dto.setAutorNome(projeto.getAutor() != null ? projeto.getAutor().getNome() : null);

        // Busca membros de forma segura
        List<ProjetoMembro> membros = List.of();
        try {
            membros = projetoMembroRepository.findByProjetoId(projeto.getId());
        } catch (Exception e) {
            System.err.println("[WARN] Erro ao buscar membros para DTO do projeto " + projeto.getId() + ": " + e.getMessage());
        }

        dto.setTotalMembros(membros.size());

        // Mapeia os membros para MembroDTO
        dto.setMembros(membros.stream().map(membro -> {
            ProjetoDTO.MembroDTO membroDTO = new ProjetoDTO.MembroDTO();
            membroDTO.setId(membro.getId());
            membroDTO.setUsuarioId(membro.getUsuario().getId());
            membroDTO.setUsuarioNome(membro.getUsuario().getNome());
            membroDTO.setUsuarioEmail(membro.getUsuario().getEmail());

            // Mapeia a foto do membro (agora o DTO tem o campo)
            membroDTO.setUsuarioFotoUrl(membro.getUsuario().getFotoPerfil() != null ?
                    "/api/arquivos/" + membro.getUsuario().getFotoPerfil() : // Usa o endpoint de arquivos
                    "/images/default-avatar.png"); // Caminho para imagem padrão

            membroDTO.setRole(membro.getRole());
            membroDTO.setDataEntrada(membro.getDataEntrada());
            membroDTO.setConvidadoPorNome(membro.getConvidadoPor() != null ?
                    membro.getConvidadoPor().getNome() : null); // Pode ser null se for o criador
            return membroDTO;
        }).collect(Collectors.toList()));

        // Busca convites pendentes de forma segura
        List<ConviteProjeto> convitesPendentes = List.of();
        try {
            convitesPendentes = conviteProjetoRepository
                    .findByProjetoIdAndStatus(projeto.getId(), ConviteProjeto.StatusConvite.PENDENTE);
        } catch (Exception e) {
            System.err.println("[WARN] Erro ao buscar convites pendentes para DTO do projeto " + projeto.getId() + ": " + e.getMessage());
        }

        // Mapeia convites para ConviteDTO
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

    // Salva a foto do projeto
    private String salvarFoto(MultipartFile foto) throws IOException {
        if (foto.isEmpty()) { throw new IOException("Arquivo de imagem está vazio"); }
        String contentType = foto.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) { throw new IOException("Arquivo deve ser uma imagem válida (ex: PNG, JPG, WEBP)"); }
        String originalFilename = foto.getOriginalFilename();
        if (originalFilename == null) { originalFilename = "image"; } // Nome padrão se não houver
        // Limpa caracteres inválidos e adiciona timestamp
        String cleanFilename = StringUtils.cleanPath(originalFilename.replaceAll("[^a-zA-Z0-9.\\-]", "_"));
        String fileExtension = StringUtils.getFilenameExtension(cleanFilename);
        String baseName = cleanFilename.replace("." + fileExtension, "");
        // Garante que a extensão não seja nula
        fileExtension = (fileExtension != null && !fileExtension.isEmpty()) ? "." + fileExtension : ".png"; // Default .png
        String fileName = baseName + "_" + System.currentTimeMillis() + fileExtension;

        Path uploadPath = Paths.get(UPLOAD_DIR);
        Files.createDirectories(uploadPath); // Garante que o diretório exista
        Path filePath = uploadPath.resolve(fileName);
        try {
            Files.copy(foto.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            System.err.println("[ERROR] Falha ao copiar arquivo para o destino: " + filePath + " - " + e.getMessage());
            throw new IOException("Erro ao salvar arquivo no servidor", e);
        }
        return fileName; // Retorna apenas o nome do arquivo gerado
    }

    // Verifica se é ADMIN (incluindo o criador)
    protected boolean isAdmin(Long projetoId, Long usuarioId) {
        Projeto projeto = projetoRepository.findById(projetoId).orElse(null);
        if (projeto != null && projeto.getAutor() != null && projeto.getAutor().getId().equals(usuarioId)) {
            return true; // Criador é admin
        }
        ProjetoMembro membro = projetoMembroRepository.findByProjetoIdAndUsuarioId(projetoId, usuarioId).orElse(null);
        return membro != null && membro.getRole() == ProjetoMembro.RoleMembro.ADMIN;
    }

    // Verifica se é ADMIN ou MODERADOR (incluindo o criador)
    protected boolean isAdminOuModerador(Long projetoId, Long usuarioId) {
        Projeto projeto = projetoRepository.findById(projetoId).orElse(null);
        if (projeto != null && projeto.getAutor() != null && projeto.getAutor().getId().equals(usuarioId)) {
            return true; // Criador é admin implicitamente
        }
        ProjetoMembro membro = projetoMembroRepository.findByProjetoIdAndUsuarioId(projetoId, usuarioId).orElse(null);
        return membro != null && (membro.getRole() == ProjetoMembro.RoleMembro.ADMIN ||
                membro.getRole() == ProjetoMembro.RoleMembro.MODERADOR);
    }

    // Adiciona o criador como membro ADMIN do projeto
    private void adicionarMembroComoAdmin(Projeto projeto, Usuario usuario) {
        // Verifica se já existe para evitar duplicatas
        if (!projetoMembroRepository.existsByProjetoIdAndUsuarioId(projeto.getId(), usuario.getId())) {
            ProjetoMembro membro = new ProjetoMembro();
            membro.setProjeto(projeto);
            membro.setUsuario(usuario);
            membro.setRole(ProjetoMembro.RoleMembro.ADMIN); // Criador é sempre ADMIN
            membro.setDataEntrada(LocalDateTime.now());
            membro.setConvidadoPor(null); // O criador não foi convidado por ninguém
            projetoMembroRepository.save(membro);
        }
    }
}