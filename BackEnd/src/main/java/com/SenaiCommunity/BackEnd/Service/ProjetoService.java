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
// import java.nio.file.Files; // Não é mais necessário
// import java.nio.file.Path; // Não é mais necessário
// import java.nio.file.Paths; // Não é mais necessário
// import java.nio.file.StandardCopyOption; // Não é mais necessário

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProjetoService {

    // ❌ UPLOAD_DIR REMOVIDO
    // private static final String UPLOAD_DIR = "uploads/projeto-pictures/";

    @Autowired
    private ProjetoRepository projetoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private ProjetoMembroRepository projetoMembroRepository;

    @Autowired
    private ConviteProjetoRepository conviteProjetoRepository;

    @Autowired
    private NotificacaoService notificacaoService;

    @Autowired
    private MensagemGrupoService mensagemGrupoService;

    // ✅ INJETADO O ARQUIVOMIDIASERVICE (CLOUDINARY)
    @Autowired
    private ArquivoMidiaService arquivoMidiaService;

    public long contarProjetosParticipando(Long userId) {
        return projetoMembroRepository.countByUsuarioId(userId);
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

    @Transactional(readOnly = true)
    public List<ProjetoDTO> listarMeusProjetos(String emailUsuario) {
        Usuario usuario = usuarioRepository.findByEmail(emailUsuario)
                .orElseThrow(() -> new EntityNotFoundException("Usuário não encontrado: " + emailUsuario));

        List<ProjetoMembro> minhasParticipacoes = projetoMembroRepository.findByUsuarioId(usuario.getId());

        return minhasParticipacoes.stream()
                .map(ProjetoMembro::getProjeto)
                .map(this::converterParaDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProjetoDTO salvar(ProjetoDTO dto, MultipartFile foto) {
        Projeto projeto;
        boolean isNovoGrupo = dto.getId() == null;

        Usuario autor = usuarioRepository.findById(dto.getAutorId())
                .orElseThrow(() -> new EntityNotFoundException("Autor (usuário logado) não encontrado com id: " + dto.getAutorId()));

        if (isNovoGrupo) {
            projeto = new Projeto();
            projeto.setAutor(autor);
            projeto.setDataCriacao(LocalDateTime.now());
            projeto.setDataInicio(new Date());
            projeto.setStatus("Em planejamento");
        } else {
            projeto = projetoRepository.findById(dto.getId())
                    .orElseThrow(() -> new EntityNotFoundException("Projeto não encontrado para atualização: " + dto.getId()));
            if (!isAdmin(projeto.getId(), autor.getId())) {
                throw new IllegalArgumentException("Apenas administradores podem editar o projeto.");
            }
            projeto.setDataInicio(dto.getDataInicio());
            projeto.setStatus(dto.getStatus());
        }

        projeto.setTitulo(dto.getTitulo());
        projeto.setDescricao(dto.getDescricao());
        projeto.setDataEntrega(dto.getDataEntrega());
        projeto.setLinksUteis(dto.getLinksUteis());
        projeto.setMaxMembros(dto.getMaxMembros() != null ? dto.getMaxMembros() : 50);
        projeto.setGrupoPrivado(dto.getGrupoPrivado() != null ? dto.getGrupoPrivado() : false);

        // ✅ LÓGICA DE UPLOAD ATUALIZADA PARA CLOUDINARY
        if (foto != null && !foto.isEmpty()) {
            try {
                // Se não for um grupo novo e já tiver uma foto (URL http), deleta a antiga
                if (!isNovoGrupo && projeto.getImagemUrl() != null && projeto.getImagemUrl().startsWith("http")) {
                    try {
                        arquivoMidiaService.deletar(projeto.getImagemUrl());
                    } catch (Exception e) {
                        System.err.println("[WARN] Falha ao deletar foto antiga do Cloudinary: " + e.getMessage());
                    }
                }
                // Faz upload da nova foto para o Cloudinary
                String urlFoto = arquivoMidiaService.upload(foto);
                projeto.setImagemUrl(urlFoto); // Salva a URL completa do Cloudinary

            } catch (IOException e) {
                System.err.println("[ERROR] Erro ao salvar a foto do projeto no Cloudinary: " + e.getMessage());
                // Lança a exceção para o controller lidar (ex: "Upload de vídeos bloqueado")
                throw new RuntimeException("Erro ao salvar foto: " + e.getMessage(), e);
            }
        }
        // Lógica para remover foto (não implementada no DTO, mas fica aqui)
        // else if (dto.getImagemUrl() != null && dto.getImagemUrl().isEmpty() && projeto.getImagemUrl() != null && projeto.getImagemUrl().startsWith("http")) {
        //     try {
        //         arquivoMidiaService.deletar(projeto.getImagemUrl());
        //     } catch (Exception e) {
        //         System.err.println("[WARN] Falha ao deletar foto antiga do Cloudinary: " + e.getMessage());
        //     }
        //     projeto.setImagemUrl(null);
        // }

        Projeto salvo = projetoRepository.save(projeto);

        if (isNovoGrupo) {
            // 1. Adiciona o criador como ADMIN
            adicionarMembroComoAdmin(salvo, autor);

            // ✅ 2. LÓGICA ATUALIZADA: Adiciona membros direto, em vez de enviar convites
            adicionarMembrosIniciais(salvo, dto.getProfessorIds(), dto.getAlunoIds(), autor);

            // 3. Prepara a lista de IDs para a mensagem do sistema
            List<Long> todosIdsConvidados = new ArrayList<>();
            if (dto.getProfessorIds() != null) todosIdsConvidados.addAll(dto.getProfessorIds());
            if (dto.getAlunoIds() != null) todosIdsConvidados.addAll(dto.getAlunoIds());
            todosIdsConvidados.remove(autor.getId()); // Remove o próprio autor da contagem

            // 4. Cria a mensagem de sistema no chat
            if (todosIdsConvidados.isEmpty()) {
                mensagemGrupoService.criarMensagemDeSistema(salvo,
                        "Bem-vindo ao chat do seu novo projeto! Adicione participantes ao projeto para começar a conversar.");
            } else {
                mensagemGrupoService.criarMensagemDeSistema(salvo,
                        "Chat do projeto '" + salvo.getTitulo() + "' criado. " + todosIdsConvidados.size() + " membro(s) foram adicionados.");
            }
        }

        return converterParaDTO(salvo);
    }

    // ❌ MÉTODO DELETADO (salvava em disco)
    // private void deletarFotoAntiga(String nomeArquivo) { ... }

    // ✅✅✅ MÉTODO NOVO (Substitui enviarConvitesAutomaticos) ✅✅✅
    // Adiciona usuários diretamente como membros
    private void adicionarMembrosIniciais(Projeto projeto, List<Long> professorIds, List<Long> alunoIds, Usuario autor) {
        List<Long> idsParaAdicionar = new ArrayList<>();
        if (professorIds != null) idsParaAdicionar.addAll(professorIds);
        if (alunoIds != null) idsParaAdicionar.addAll(alunoIds);

        for (Long usuarioId : idsParaAdicionar) {
            // Pula o autor (ele já é admin)
            if (usuarioId.equals(autor.getId())) {
                continue;
            }

            try {
                // Verifica se já não é membro (segurança)
                if (projetoMembroRepository.existsByProjetoIdAndUsuarioId(projeto.getId(), usuarioId)) {
                    continue;
                }

                Usuario usuario = usuarioRepository.findById(usuarioId)
                        .orElseThrow(() -> new EntityNotFoundException("Usuário " + usuarioId + " não encontrado."));

                // Cria a entidade de MEMBRO direto
                ProjetoMembro membro = new ProjetoMembro();
                membro.setProjeto(projeto);
                membro.setUsuario(usuario);
                membro.setRole(ProjetoMembro.RoleMembro.MEMBRO); // Entra como membro normal
                membro.setDataEntrada(LocalDateTime.now());
                membro.setConvidadoPor(autor); // Guarda quem adicionou
                projetoMembroRepository.save(membro);

                // Notifica o usuário que ele foi ADICIONADO (não convidado)
                String mensagemNotificacao = String.format("adicionou você ao projeto '%s'.", projeto.getTitulo());
                notificacaoService.criarNotificacao(
                        usuario,        // 1. Para quem é a notificação
                        autor,          // 2. Quem adicionou
                        mensagemNotificacao,
                        "PROJETO_ADICIONADO", // Tipo da notificação
                        projeto.getId() // ID do Projeto
                );

            } catch (Exception e) {
                System.err.println("[WARN] Erro ao adicionar membro automático " + usuarioId + ": " + e.getMessage());
            }
        }
    }

    // ❌ MÉTODO ANTIGO (Não é mais usado no 'salvar')
    // private void enviarConvitesAutomaticos(Projeto projeto, List<Long> professorIds, List<Long> alunoIds, Long autorId) { ... }

    // ... (Os métodos enviarConvite, aceitarConvite, recusarConvite ainda existem para o Modal de Detalhes) ...
    // ... (Lógica de enviarConvite, aceitarConvite, recusarConvite, expulsarMembro, alterarPermissao, atualizarInfoGrupo não mudam) ...

    @Transactional
    public void enviarConvite(Long projetoId, Long usuarioConvidadoId, Long usuarioConvidadorId) {
        Projeto projeto = projetoRepository.findById(projetoId)
                .orElseThrow(() -> new EntityNotFoundException("Projeto não encontrado: " + projetoId));
        Usuario usuarioConvidado = usuarioRepository.findById(usuarioConvidadoId)
                .orElseThrow(() -> new EntityNotFoundException("Usuário convidado não encontrado: " + usuarioConvidadoId));
        Usuario usuarioConvidador = usuarioRepository.findById(usuarioConvidadorId)
                .orElseThrow(() -> new EntityNotFoundException("Usuário convidador não encontrado: " + usuarioConvidadorId));

        // --- VALIDAÇÕES ---
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
        // --- FIM VALIDAÇÕES ---

        ConviteProjeto convite = new ConviteProjeto();
        convite.setProjeto(projeto);
        convite.setUsuarioConvidado(usuarioConvidado);
        convite.setConvidadoPor(usuarioConvidador);
        convite.setStatus(ConviteProjeto.StatusConvite.PENDENTE);
        convite.setDataConvite(LocalDateTime.now());
        ConviteProjeto conviteSalvo = conviteProjetoRepository.save(convite); // Salva para ter o ID

        // --- CRIA A NOTIFICAÇÃO CORRETAMENTE ---
        String mensagemNotificacao = String.format("convidou você para o projeto '%s'.", projeto.getTitulo());

        notificacaoService.criarNotificacao(
                usuarioConvidado,     // 1. Para quem é a notificação
                usuarioConvidador,    // 2. Quem está convidando (REMETENTE)
                mensagemNotificacao,  // 3. A mensagem
                "CONVITE_PROJETO",    // 4. Tipo da notificação
                conviteSalvo.getId()  // 5. ID do CONVITE (não do projeto!)
        );
        // --- FIM ---
    }

    // ... (aceitarConvite, recusarConvite, expulsarMembro, alterarPermissao, atualizarInfoGrupo não mudam) ...
    @Transactional
    public void aceitarConvite(Long conviteId, Long usuarioId) {
        ConviteProjeto convite = conviteProjetoRepository.findById(conviteId)
                .orElseThrow(() -> new EntityNotFoundException("Convite não encontrado: " + conviteId));

        // --- VALIDAÇÕES ---
        if (!convite.getUsuarioConvidado().getId().equals(usuarioId)) {
            throw new IllegalArgumentException("Este convite não é para você.");
        }
        if (convite.getStatus() != ConviteProjeto.StatusConvite.PENDENTE) {
            throw new IllegalArgumentException("Este convite já foi respondido (" + convite.getStatus() + ").");
        }
        Integer totalMembros = projetoMembroRepository.countMembrosByProjetoId(convite.getProjeto().getId());
        Integer maxMembros = convite.getProjeto().getMaxMembros() != null ? convite.getProjeto().getMaxMembros() : 50;
        if (totalMembros >= maxMembros) {
            convite.setStatus(ConviteProjeto.StatusConvite.RECUSADO); // Marca como recusado por limite
            convite.setDataResposta(LocalDateTime.now());
            conviteProjetoRepository.save(convite);
            throw new IllegalArgumentException("O projeto atingiu o limite máximo de membros ("+ maxMembros +") enquanto o convite estava pendente.");
        }
        // --- FIM VALIDAÇÕES ---

        // Atualiza o convite
        convite.setStatus(ConviteProjeto.StatusConvite.ACEITO);
        convite.setDataResposta(LocalDateTime.now());
        conviteProjetoRepository.save(convite);

        // Adiciona como membro
        ProjetoMembro membro = new ProjetoMembro();
        membro.setProjeto(convite.getProjeto());
        membro.setUsuario(convite.getUsuarioConvidado());
        membro.setRole(ProjetoMembro.RoleMembro.MEMBRO); // Entra como membro normal
        membro.setDataEntrada(LocalDateTime.now());
        membro.setConvidadoPor(convite.getConvidadoPor()); // Guarda quem convidou
        projetoMembroRepository.save(membro);

        // --- NOTIFICA QUEM CONVIDOU ---
        String mensagemNotificacao = String.format("aceitou seu convite para o projeto '%s'.", convite.getProjeto().getTitulo());
        notificacaoService.criarNotificacao(
                convite.getConvidadoPor(),     // 1. Para quem convidou originalmente
                convite.getUsuarioConvidado(), // 2. Quem aceitou (REMETENTE da ação)
                mensagemNotificacao,
                "CONVITE_ACEITO",
                convite.getProjeto().getId()   // 5. ID de Referência (Pode ser o ID do Projeto aqui)
        );
        // --- FIM ---
    }

    @Transactional
    public void recusarConvite(Long conviteId, Long usuarioId) {
        ConviteProjeto convite = conviteProjetoRepository.findById(conviteId)
                .orElseThrow(() -> new EntityNotFoundException("Convite não encontrado: " + conviteId));

        // Usuário que recebeu o convite está recusando
        if (convite.getUsuarioConvidado().getId().equals(usuarioId)) {
            if (convite.getStatus() != ConviteProjeto.StatusConvite.PENDENTE) {
                throw new IllegalArgumentException("Este convite já foi respondido (" + convite.getStatus() + ").");
            }
            convite.setStatus(ConviteProjeto.StatusConvite.RECUSADO);
            convite.setDataResposta(LocalDateTime.now());
            conviteProjetoRepository.save(convite);

            // Notifica quem convidou
            String msg = String.format("recusou seu convite para o projeto '%s'.", convite.getProjeto().getTitulo());
            notificacaoService.criarNotificacao(
                    convite.getConvidadoPor(),     // Para quem convidou
                    convite.getUsuarioConvidado(), // Quem recusou (Remetente)
                    msg,
                    "CONVITE_RECUSADO",
                    convite.getProjeto().getId()
            );

            // Usuário que enviou o convite está cancelando
        } else if (convite.getConvidadoPor() != null && convite.getConvidadoPor().getId().equals(usuarioId)) {
            if (convite.getStatus() != ConviteProjeto.StatusConvite.PENDENTE) {
                throw new IllegalArgumentException("Você não pode cancelar um convite que já foi respondido.");
            }
            convite.setStatus(ConviteProjeto.StatusConvite.CANCELADO); // Usa o enum correto
            convite.setDataResposta(LocalDateTime.now());
            conviteProjetoRepository.save(convite);

            // Notifica quem receberia o convite
            String msgCancelado = String.format("cancelou o convite para o projeto '%s'.", convite.getProjeto().getTitulo());
            notificacaoService.criarNotificacao(
                    convite.getUsuarioConvidado(), // Para quem receberia
                    convite.getConvidadoPor(),     // Quem cancelou (Remetente)
                    msgCancelado,
                    "CONVITE_CANCELADO",
                    convite.getProjeto().getId()
            );
        } else {
            throw new IllegalArgumentException("Você não pode recusar/cancelar este convite.");
        }
    }

    @Transactional
    public void expulsarMembro(Long projetoId, Long membroId, Long adminId) {
        // ... (validações: se é admin/mod, se não é o criador, se pode expulsar)
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
        // --- FIM VALIDAÇÕES ---

        projetoMembroRepository.delete(membroParaExpulsar);

        // --- NOTIFICA O MEMBRO EXPULSO ---
        Usuario adminUser = usuarioRepository.findById(adminId).orElse(null); // Pega o usuário admin para ser o remetente
        String mensagem = String.format("removeu você do projeto '%s'.", projeto.getTitulo());
        notificacaoService.criarNotificacao(
                membroParaExpulsar.getUsuario(), // Para quem foi expulso
                adminUser,                       // Quem expulsou (Remetente)
                mensagem,
                "MEMBRO_REMOVIDO",
                projeto.getId()
        );
        // --- FIM ---
    }


    @Transactional
    public void alterarPermissao(Long projetoId, Long membroId, ProjetoMembro.RoleMembro novaRole, Long adminId) {
        Projeto projeto = projetoRepository.findById(projetoId).orElseThrow(() -> new EntityNotFoundException("Projeto não encontrado"));
        // Validação: Somente o CRIADOR pode alterar permissões
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

        // --- NOTIFICA O MEMBRO QUE TEVE A PERMISSÃO ALTERADA ---
        Usuario adminUser = usuarioRepository.findById(adminId).orElse(null); // Criador
        String mensagem = String.format("alterou sua permissão no projeto '%s' para %s.", projeto.getTitulo(), novaRole.toString());
        notificacaoService.criarNotificacao(
                membro.getUsuario(),    // Para quem teve a permissão alterada
                adminUser,              // Quem alterou (Remetente - Criador)
                mensagem,
                "PERMISSAO_ALTERADA",
                projeto.getId()
        );
        // --- FIM ---
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
        // Poderia enviar notificação aos membros sobre a atualização?
    }


    @Transactional
    public void deletar(Long id, Long adminId) {
        Projeto projeto = projetoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Projeto não encontrado com id: " + id));
        // Validação: Somente o CRIADOR pode deletar
        if (!projeto.getAutor().getId().equals(adminId)) {
            throw new IllegalArgumentException("Apenas o criador pode deletar o projeto.");
        }

        // ✅ DELETA A FOTO DO CLOUDINARY ANTES DE DELETAR O PROJETO
        if (projeto.getImagemUrl() != null && projeto.getImagemUrl().startsWith("http")) {
            try {
                arquivoMidiaService.deletar(projeto.getImagemUrl());
            } catch (Exception e) {
                System.err.println("[WARN] Falha ao deletar foto do projeto do Cloudinary: " + e.getMessage());
            }
        }

        projetoRepository.delete(projeto); // Cascade deve cuidar do resto (membros, convites, mensagens?)
        System.out.println("[DEBUG] Projeto deletado com sucesso: " + id);
    }


    // ✅ ATUALIZADO: converterParaDTO (para fotos de membros)
    private ProjetoDTO converterParaDTO(Projeto projeto) {
        ProjetoDTO dto = new ProjetoDTO();
        dto.setId(projeto.getId());
        dto.setTitulo(projeto.getTitulo());
        dto.setDescricao(projeto.getDescricao());
        dto.setDataInicio(projeto.getDataInicio());
        dto.setDataEntrega(projeto.getDataEntrega());
        dto.setStatus(projeto.getStatus());
        dto.setLinksUteis(projeto.getLinksUteis());

        // ✅ A imagemUrl agora é a URL completa do Cloudinary (ou null)
        dto.setImagemUrl(projeto.getImagemUrl());

        dto.setDataCriacao(projeto.getDataCriacao());
        dto.setMaxMembros(projeto.getMaxMembros());
        dto.setGrupoPrivado(projeto.getGrupoPrivado());
        dto.setAutorId(projeto.getAutor() != null ? projeto.getAutor().getId() : null);
        dto.setAutorNome(projeto.getAutor() != null ? projeto.getAutor().getNome() : null);

        List<ProjetoMembro> membros = List.of();
        try {
            membros = projetoMembroRepository.findByProjetoId(projeto.getId());
        } catch (Exception e) {
            System.err.println("[WARN] Erro ao buscar membros para DTO do projeto " + projeto.getId() + ": " + e.getMessage());
        }
        dto.setTotalMembros(membros.size());

        dto.setMembros(membros.stream().map(membro -> {
            ProjetoDTO.MembroDTO membroDTO = new ProjetoDTO.MembroDTO();
            membroDTO.setId(membro.getId());
            membroDTO.setUsuarioId(membro.getUsuario().getId());
            membroDTO.setUsuarioNome(membro.getUsuario().getNome());
            membroDTO.setUsuarioEmail(membro.getUsuario().getEmail());

            // ✅ CORRIGIDO: Monta a URL da foto do membro (lógica do UsuarioService)
            String fotoMembro = membro.getUsuario().getFotoPerfil();
            String urlFotoCorrigida = null;
            if (fotoMembro != null && !fotoMembro.isBlank()) {
                if (fotoMembro.startsWith("http")) {
                    urlFotoCorrigida = fotoMembro; // Cloudinary/Google
                } else {
                    urlFotoCorrigida = "/api/arquivos/" + fotoMembro; // Local
                }
            }
            // Se for nulo, o DTO frontend vai usar o fallback
            membroDTO.setUsuarioFotoUrl(urlFotoCorrigida);

            membroDTO.setRole(membro.getRole());
            membroDTO.setDataEntrada(membro.getDataEntrada());
            membroDTO.setConvidadoPorNome(membro.getConvidadoPor() != null ?
                    membro.getConvidadoPor().getNome() : null);
            return membroDTO;
        }).collect(Collectors.toList()));

        List<ConviteProjeto> convitesPendentes = List.of();
        try {
            convitesPendentes = conviteProjetoRepository
                    .findByProjetoIdAndStatus(projeto.getId(), ConviteProjeto.StatusConvite.PENDENTE);
        } catch (Exception e) {
            System.err.println("[WARN] Erro ao buscar convites pendentes para DTO do projeto " + projeto.getId() + ": " + e.getMessage());
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

    // ❌ MÉTODO DELETADO (salvava em disco)
    // private String salvarFoto(MultipartFile foto) throws IOException { ... }

    // ... (isAdmin, isAdminOuModerador, adicionarMembroComoAdmin não mudam) ...
    protected boolean isAdmin(Long projetoId, Long usuarioId) {
        Projeto projeto = projetoRepository.findById(projetoId).orElse(null);
        if (projeto != null && projeto.getAutor() != null && projeto.getAutor().getId().equals(usuarioId)) {
            return true; // Criador é admin
        }
        ProjetoMembro membro = projetoMembroRepository.findByProjetoIdAndUsuarioId(projetoId, usuarioId).orElse(null);
        return membro != null && membro.getRole() == ProjetoMembro.RoleMembro.ADMIN;
    }

    protected boolean isAdminOuModerador(Long projetoId, Long usuarioId) {
        Projeto projeto = projetoRepository.findById(projetoId).orElse(null);
        if (projeto != null && projeto.getAutor() != null && projeto.getAutor().getId().equals(usuarioId)) {
            return true; // Criador é admin implicitamente
        }
        ProjetoMembro membro = projetoMembroRepository.findByProjetoIdAndUsuarioId(projetoId, usuarioId).orElse(null);
        return membro != null && (membro.getRole() == ProjetoMembro.RoleMembro.ADMIN ||
                membro.getRole() == ProjetoMembro.RoleMembro.MODERADOR);
    }

    private void adicionarMembroComoAdmin(Projeto projeto, Usuario usuario) {
        if (!projetoMembroRepository.existsByProjetoIdAndUsuarioId(projeto.getId(), usuario.getId())) {
            ProjetoMembro membro = new ProjetoMembro();
            membro.setProjeto(projeto);
            membro.setUsuario(usuario);
            membro.setRole(ProjetoMembro.RoleMembro.ADMIN);
            membro.setDataEntrada(LocalDateTime.now());
            membro.setConvidadoPor(null);
            projetoMembroRepository.save(membro);
        }
    }
}