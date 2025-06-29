package com.SenaiCommunity.BackEnd.Service;

import com.SenaiCommunity.BackEnd.DTO.ArquivoMidiaDTO;
import com.SenaiCommunity.BackEnd.DTO.PostagemSaidaDTO;
import com.SenaiCommunity.BackEnd.Entity.*;
import com.SenaiCommunity.BackEnd.Repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ChatService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private ProjetoRepository projetoRepository;

    @Autowired
    private MensagemGrupoRepository mensagemGrupoRepository;

    @Autowired
    private MensagemPrivadaRepository mensagemPrivadaRepository;

    @Autowired
    private PostagemRepository postagemRepository;

    @Autowired
    private ArquivoMidiaRepository arquivoMidiaRepository;

    @Autowired
    private ArquivoMidiaService midiaService;

    public PostagemSaidaDTO toDTO(Postagem postagem) {
        PostagemSaidaDTO dto = new PostagemSaidaDTO();
        dto.setAutor(postagem.getAutor().getNome()); // ou .getEmail() se preferir
        dto.setConteudo(postagem.getConteudo());
        dto.setDataPostagem(postagem.getDataPostagem());

        List<ArquivoMidiaDTO> arquivosDTO = postagem.getArquivos().stream().map(arquivo -> {
            ArquivoMidiaDTO arq = new ArquivoMidiaDTO();
            arq.setUrlCompleta(arquivo.getUrl());
            arq.setTipo(arquivo.getTipo());
            return arq;
        }).toList();

        dto.setArquivos(arquivosDTO);
        return dto;
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

    public MensagemPrivada salvarMensagemPrivada(MensagemPrivada mensagem, Long destinatarioId) {
        Usuario remetente = usuarioRepository.findByEmail(mensagem.getRemetenteUsername())
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        Usuario destinatario = usuarioRepository.findById(destinatarioId)
                .orElseThrow(() -> new RuntimeException("Destinatário não encontrado"));

        mensagem.setRemetente(remetente);
        mensagem.setDestinatario(destinatario);
        return mensagemPrivadaRepository.save(mensagem);
    }

    public Postagem salvarPostagem(Postagem postagem, List<String> arquivosUrl) {
        Usuario autor = usuarioRepository.findByEmail(postagem.getAutorUsername())
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        postagem.setAutor(autor);

        // Vincula arquivos, se existirem
        if (arquivosUrl != null && !arquivosUrl.isEmpty()) {
            List<ArquivoMidia> arquivos = arquivosUrl.stream().map(url -> {
                ArquivoMidia midia = new ArquivoMidia();
                midia.setUrl(url);
                midia.setTipo(midiaService.detectarTipoPelaUrl(url));
                midia.setPostagem(postagem);
                return midia;
            }).toList();
            postagem.setArquivos(arquivos);
        }

        return postagemRepository.save(postagem);
    }

    public List<MensagemPrivada> buscarMensagensPrivadas(Long user1, Long user2) {
        return mensagemPrivadaRepository.findMensagensEntreUsuarios(user1, user2);
    }

    public List<MensagemGrupo> buscarMensagensDoGrupo(Long projetoId) {
        return mensagemGrupoRepository.findByProjetoIdOrderByDataEnvioAsc(projetoId);
    }

    public List<Postagem> buscarPostagensPublicas() {
        return postagemRepository.findTop50ByOrderByDataPostagemDesc();
    }

}
