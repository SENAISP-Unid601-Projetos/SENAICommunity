package com.SenaiCommunity.BackEnd.Service;

import com.SenaiCommunity.BackEnd.DTO.MensagemGrupoEntradaDTO;
import com.SenaiCommunity.BackEnd.DTO.MensagemGrupoSaidaDTO;
import com.SenaiCommunity.BackEnd.Entity.ArquivoMidia;
import com.SenaiCommunity.BackEnd.Entity.MensagemGrupo;
import com.SenaiCommunity.BackEnd.Entity.Projeto;
import com.SenaiCommunity.BackEnd.Entity.Usuario;
import com.SenaiCommunity.BackEnd.Exception.ConteudoImproprioException;
import com.SenaiCommunity.BackEnd.Repository.MensagemGrupoRepository;
import com.SenaiCommunity.BackEnd.Repository.ProjetoMembroRepository;
import com.SenaiCommunity.BackEnd.Repository.ProjetoRepository;
import com.SenaiCommunity.BackEnd.Repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Service
public class MensagemGrupoService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private ProjetoRepository projetoRepository;

    @Autowired
    private MensagemGrupoRepository mensagemGrupoRepository;

    @Autowired
    private ProjetoMembroRepository projetoMembroRepository;

    @Autowired
    private NotificacaoService notificacaoService;

    @Autowired
    private ArquivoMidiaService arquivoMidiaService;

    @Autowired
    private FiltroProfanidadeService filtroProfanidade;

    // --- CONVERSÃO ENTIDADE -> DTO ---
    public MensagemGrupoSaidaDTO toDTO(MensagemGrupo mensagem) {
        return MensagemGrupoSaidaDTO.builder()
                .id(mensagem.getId())
                .conteudo(mensagem.getConteudo())
                .dataEnvio(mensagem.getDataEnvio())
                .grupoId(mensagem.getProjeto().getId())
                .autorId(mensagem.getAutor().getId())
                .nomeAutor(mensagem.getAutor().getNome())
                .urlFotoAutor(mensagem.getAutor().getFotoPerfil())
                .anexos(mensagem.getAnexos() != null ?
                        mensagem.getAnexos().stream().map(m -> {
                            MensagemGrupoSaidaDTO.AnexoDTO anexo = new MensagemGrupoSaidaDTO.AnexoDTO();
                            anexo.setUrl(m.getUrl());
                            anexo.setType(m.getTipo() != null ? m.getTipo() : arquivoMidiaService.detectarTipoPelaUrl(m.getUrl()));
                            return anexo;
                        }).collect(Collectors.toList())
                        : null)
                .build();
    }

    // --- CONVERSÃO DTO -> ENTIDADE (Básica) ---
    private MensagemGrupo toEntity(MensagemGrupoEntradaDTO dto, Usuario autor, Projeto projeto) {
        return MensagemGrupo.builder()
                .conteudo(dto.getConteudo())
                .dataEnvio(LocalDateTime.now())
                .projeto(projeto)
                .autor(autor)
                .build();
    }

    // --- SALVAR MENSAGEM (Criação) ---
    @Transactional
    public MensagemGrupoSaidaDTO salvarMensagemGrupo(MensagemGrupoEntradaDTO dto, Long projetoId, String autorUsername) {

        // 1. Validação de Profanidade
        if (filtroProfanidade.contemProfanidade(dto.getConteudo())) {
            throw new ConteudoImproprioException("Sua mensagem contém texto não permitido.");
        }

        // 2. Buscas de Entidades
        Usuario autor = usuarioRepository.findByEmail(autorUsername)
                .orElseThrow(() -> new NoSuchElementException("Usuário não encontrado"));

        Projeto projeto = projetoRepository.findById(projetoId)
                .orElseThrow(() -> new NoSuchElementException("Projeto não encontrado"));

        // 3. Validação de Segurança (É membro?)
        boolean isMember = projetoMembroRepository.existsByProjetoIdAndUsuarioId(projetoId, autor.getId());
        // Se o autor do projeto enviar msg, ele pode não estar na tabela de membros, mas é dono
        boolean isOwner = projeto.getAutor().getId().equals(autor.getId());

        if (!isMember && !isOwner) {
            throw new SecurityException("Acesso negado: você não é membro deste projeto.");
        }

        // 4. Salvar Mensagem (Inicialmente sem anexos para gerar ID)
        MensagemGrupo novaMensagem = toEntity(dto, autor, projeto);
        MensagemGrupo mensagemSalva = mensagemGrupoRepository.save(novaMensagem);

        // 5. Processar Anexos (Se houver)
        if (dto.getAnexos() != null && !dto.getAnexos().isEmpty()) {
            List<ArquivoMidia> midias = new ArrayList<>();

            for (MensagemGrupoEntradaDTO.AnexoDTO anexoDto : dto.getAnexos()) {
                // Detecta o tipo (imagem, video, raw) baseado na extensão da URL
                String tipo = arquivoMidiaService.detectarTipoPelaUrl(anexoDto.getUrl());

                ArquivoMidia midia = ArquivoMidia.builder()
                        .url(anexoDto.getUrl())
                        .tipo(tipo)
                        .mensagemGrupo(mensagemSalva) // Vínculo importante: Mídia -> Mensagem
                        .build();

                midias.add(midia);
            }

            // Atualiza a lista na entidade pai
            mensagemSalva.setAnexos(midias);

            // Salva novamente para persistir os anexos via CascadeType.ALL
            mensagemSalva = mensagemGrupoRepository.save(mensagemSalva);
        }

        // 6. Notificar Membros
        projetoMembroRepository.findByProjetoId(projetoId).stream()
                .filter(membro -> !membro.getUsuario().getId().equals(autor.getId()))
                .forEach(membro -> notificacaoService.criarNotificacao(
                        membro.getUsuario(),
                        "Nova mensagem no projeto '" + projeto.getTitulo() + "': " + autor.getNome() + " disse..."
                ));

        return toDTO(mensagemSalva);
    }

    // --- EDITAR MENSAGEM ---
    @Transactional
    public MensagemGrupoSaidaDTO editarMensagemGrupo(Long id, String novoConteudo, String autorUsername) {

        if (filtroProfanidade.contemProfanidade(novoConteudo)) {
            throw new ConteudoImproprioException("Sua mensagem contém texto não permitido.");
        }

        MensagemGrupo mensagem = mensagemGrupoRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Mensagem não encontrada"));

        if (!mensagem.getAutor().getEmail().equals(autorUsername)) {
            throw new SecurityException("Você não pode editar esta mensagem.");
        }

        // Nota: Nesta implementação, editamos apenas o texto.
        // Se quiser permitir editar anexos, lógica similar ao PostagemService seria necessária aqui.
        mensagem.setConteudo(novoConteudo);

        MensagemGrupo mensagemAtualizada = mensagemGrupoRepository.save(mensagem);
        return toDTO(mensagemAtualizada);
    }

    // --- EXCLUIR MENSAGEM ---
    @Transactional
    public MensagemGrupo excluirMensagemGrupo(Long id, String autorUsername) {
        MensagemGrupo mensagem = mensagemGrupoRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Mensagem não encontrada"));

        // Verifica se é o autor da mensagem OU Admin do projeto (opcional, adicionei lógica básica de autor)
        boolean isAutorMsg = mensagem.getAutor().getEmail().equals(autorUsername);
        // boolean isAdminProjeto = ... (poderia ser implementado)

        if (!isAutorMsg) {
            throw new SecurityException("Você não pode excluir esta mensagem.");
        }

        // IMPORTANTE: Limpar arquivos do Cloudinary antes de deletar do banco
        if (mensagem.getAnexos() != null && !mensagem.getAnexos().isEmpty()) {
            // Cria uma cópia da lista para iterar com segurança
            List<ArquivoMidia> anexosParaDeletar = new ArrayList<>(mensagem.getAnexos());

            for (ArquivoMidia midia : anexosParaDeletar) {
                try {
                    // Tenta deletar da nuvem
                    arquivoMidiaService.deletar(midia.getUrl());
                } catch (IOException e) {
                    // Apenas loga o erro, não impede a exclusão do banco
                    System.err.println("Erro ao deletar mídia do Cloudinary: " + midia.getUrl());
                }
            }
        }

        mensagemGrupoRepository.delete(mensagem);
        return mensagem;
    }

    // --- BUSCAR MENSAGENS ---
    public List<MensagemGrupoSaidaDTO> buscarMensagensPorProjeto(Long projetoId) {
        List<MensagemGrupo> mensagens = mensagemGrupoRepository.findByProjetoIdOrderByDataEnvioAsc(projetoId);

        return mensagens.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }
}