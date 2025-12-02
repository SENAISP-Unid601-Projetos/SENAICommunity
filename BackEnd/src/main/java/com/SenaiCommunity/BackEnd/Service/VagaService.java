package com.SenaiCommunity.BackEnd.Service;

import com.SenaiCommunity.BackEnd.DTO.VagaEntradaDTO;
import com.SenaiCommunity.BackEnd.DTO.VagaSaidaDTO;
import com.SenaiCommunity.BackEnd.Entity.AlertaVaga;
import com.SenaiCommunity.BackEnd.Entity.Usuario;
import com.SenaiCommunity.BackEnd.Entity.Vaga;
import com.SenaiCommunity.BackEnd.Exception.ConteudoImproprioException;
import com.SenaiCommunity.BackEnd.Repository.AlertaVagaRepository;
import com.SenaiCommunity.BackEnd.Repository.UsuarioRepository;
import com.SenaiCommunity.BackEnd.Repository.VagaRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.AccessDeniedException;
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
    private AlertaVagaRepository alertaVagaRepository;

    @Autowired
    private NotificacaoService notificacaoService;

    @Autowired
    private FiltroProfanidadeService filtroProfanidade;

    @Autowired
    private ArquivoMidiaService midiaService;

    private static final String IMAGEM_PADRAO = "/images/default-job.png";

    @Transactional
    public VagaSaidaDTO criar(VagaEntradaDTO dto, String autorEmail, MultipartFile imagem) {

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
        vaga.setSalario(dto.getSalario());

        if (dto.getRequisitos() != null) vaga.setRequisitos(dto.getRequisitos());
        if (dto.getBeneficios() != null) vaga.setBeneficios(dto.getBeneficios());

        if (imagem != null && !imagem.isEmpty()) {
            try {
                String url = midiaService.upload(imagem);
                vaga.setImagemUrl(url);
            } catch (IOException e) {
                throw new RuntimeException("Erro ao fazer upload da imagem da vaga", e);
            }
        }

        vaga.setDataPublicacao(LocalDateTime.now());
        vaga.setAutor(autor);

        Vaga vagaSalva = vagaRepository.save(vaga);

        processarAlertasDeVaga(vagaSalva);

        return new VagaSaidaDTO(vagaSalva);
    }

    /**
     * Verifica se a nova vaga corresponde a algum alerta de usuário e envia notificação.
     */
    private void processarAlertasDeVaga(Vaga vaga) {
        // 1. Busca alertas que batem com o nível da vaga (ou aceitam qualquer nível)
        List<AlertaVaga> alertasCandidatos = alertaVagaRepository.findCompativeisPorNivel(vaga.getNivel());

        for (AlertaVaga alerta : alertasCandidatos) {
            // Ignora se o dono do alerta for o próprio autor da vaga (opcional)
            if (alerta.getUsuario().getId().equals(vaga.getAutor().getId())) {
                continue;
            }

            // 2. Verifica a Palavra-Chave
            // Normaliza para minúsculas para facilitar a comparação
            String termo = alerta.getPalavraChave().toLowerCase();
            String tituloVaga = vaga.getTitulo().toLowerCase();
            String descVaga = vaga.getDescricao().toLowerCase();

            // Verifica também na lista de requisitos se houver
            boolean achouNosRequisitos = vaga.getRequisitos() != null &&
                    vaga.getRequisitos().stream().anyMatch(req -> req.toLowerCase().contains(termo));

            // Se a palavra-chave estiver no título, na descrição ou nos requisitos
            if (tituloVaga.contains(termo) || descVaga.contains(termo) || achouNosRequisitos) {

                // 3. Envia a Notificação
                String mensagem = "Nova vaga encontrada para seu alerta '" + alerta.getPalavraChave() + "': " + vaga.getTitulo() + " na " + vaga.getEmpresa();

                notificacaoService.criarNotificacao(
                        alerta.getUsuario(),     // Destinatário
                        mensagem,                // Mensagem
                        "ALERTA_VAGA",           // Tipo (usado para ícone/lógica no front)
                        vaga.getId()             // ID Referência (para clicar e ir pra vaga)
                );
            }
        }
    }

    @Transactional
    public VagaSaidaDTO atualizar(Long id, VagaEntradaDTO dto, String usuarioEmail, MultipartFile imagem) throws AccessDeniedException {
        Vaga vaga = vagaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Vaga não encontrada"));

        // Verifica permissão (Admin pode tudo, Professor só as suas - regra simplificada aqui)
        Usuario usuario = usuarioRepository.findByEmail(usuarioEmail).orElseThrow();
        // Se quiser restringir edição apenas ao dono:
      if (!vaga.getAutor().getId().equals(usuario.getId()) && !usuario.getTipoUsuario().equals("ADMIN")) {
          throw new AccessDeniedException("Você não tem permissão para editar esta vaga.");
      }

        mapearDtoParaEntidade(dto, vaga);
        if (imagem != null && !imagem.isEmpty()) {
            try {
                if (vaga.getImagemUrl() != null && vaga.getImagemUrl().contains("cloudinary")) {
                    midiaService.deletar(vaga.getImagemUrl());
                }
                String url = midiaService.upload(imagem);
                vaga.setImagemUrl(url);
            } catch (IOException e) {
                throw new RuntimeException("Erro ao atualizar imagem da vaga", e);
            }
        }
        return new VagaSaidaDTO(vagaRepository.save(vaga));
    }

    @Transactional
    public void excluir(Long id, String usuarioEmail) {
        Vaga vaga = vagaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Vaga não encontrada"));
        vagaRepository.delete(vaga);
    }

    public List<VagaSaidaDTO> listarTodas() {
        return vagaRepository.findAll().stream()
                .map(VagaSaidaDTO::new)
                .collect(Collectors.toList());
    }

    // Auxiliar para evitar repetição de código
    private void mapearDtoParaEntidade(VagaEntradaDTO dto, Vaga vaga) {
        vaga.setTitulo(dto.getTitulo());
        vaga.setDescricao(dto.getDescricao());
        vaga.setEmpresa(dto.getEmpresa());
        vaga.setLocalizacao(dto.getLocalizacao());
        vaga.setNivel(dto.getNivel());
        vaga.setTipoContratacao(dto.getTipoContratacao());
        vaga.setSalario(dto.getSalario());
        if (dto.getRequisitos() != null) vaga.setRequisitos(dto.getRequisitos());
        if (dto.getBeneficios() != null) vaga.setBeneficios(dto.getBeneficios());
    }
}