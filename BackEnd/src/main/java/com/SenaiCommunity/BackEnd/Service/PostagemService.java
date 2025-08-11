package com.SenaiCommunity.BackEnd.Service;

import com.SenaiCommunity.BackEnd.DTO.PostagemEntradaDTO;
import com.SenaiCommunity.BackEnd.DTO.PostagemSaidaDTO;
import com.SenaiCommunity.BackEnd.Entity.*;
import com.SenaiCommunity.BackEnd.Repository.PostagemRepository;
import com.SenaiCommunity.BackEnd.Repository.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PostagemService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PostagemRepository postagemRepository;

    @Autowired
    private ArquivoMidiaService midiaService;

    public PostagemSaidaDTO criarPostagem(String autorUsername, String conteudo, List<MultipartFile> arquivos) {
        Usuario autor = usuarioRepository.findByEmail(autorUsername)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        List<ArquivoMidia> midias = new ArrayList<>();

        for (MultipartFile file : arquivos) {
            try {
                String url = midiaService.upload(file);
                ArquivoMidia midia = ArquivoMidia.builder()
                        .url(url)
                        .tipo(midiaService.detectarTipoPelaUrl(url))
                        .build();
                midias.add(midia);
            } catch (IOException e) {
                // Logar ou reencapsular
                throw new RuntimeException("Erro ao fazer upload do arquivo: " + file.getOriginalFilename(), e);
            }
        }

        Postagem postagem = Postagem.builder()
                .autor(autor)
                .conteudo(conteudo)
                .dataPostagem(LocalDateTime.now())
                .arquivos(midias)
                .build();

        // Vincular a postagem a cada mídia
        midias.forEach(m -> m.setPostagem(postagem));

        Postagem salva = postagemRepository.save(postagem);
        return toDTO(salva);
    }

    public PostagemSaidaDTO editarPostagem(Long id, String username, String novoConteudo) {
        Postagem postagem = buscarPorId(id);

        if (!postagem.getAutorUsername().equals(username)) {
            throw new SecurityException("Você não pode editar esta postagem.");
        }

        postagem.setConteudo(novoConteudo);
        Postagem atualizada = postagemRepository.save(postagem);

        return toDTO(atualizada);
    }

    public void excluirPostagem(Long id, String username) {
        Postagem postagem = buscarPorId(id);

        if (!postagem.getAutorUsername().equals(username)) {
            throw new SecurityException("Você não pode excluir esta postagem.");
        }

        postagemRepository.deleteById(id);
    }

    public List<Postagem> buscarPostagensPublicas() {
        return postagemRepository.findTop50ByOrderByDataPostagemDesc();
    }

    public Postagem buscarPorId(Long id) {
        return postagemRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Postagem não encontrada"));
    }

    public PostagemSaidaDTO toDTO(Postagem postagem) {
        return PostagemSaidaDTO.builder()
                .id(postagem.getId())
                .conteudo(postagem.getConteudo())
                .dataCriacao(postagem.getDataPostagem())
                .autorId(postagem.getAutor().getId())
                .nomeAutor(postagem.getAutor().getNome())
                .urlsMidia(postagem.getArquivos().stream()
                        .map(ArquivoMidia::getUrl)
                        .collect(Collectors.toList()))
                .build();
    }

    public Postagem toEntity(PostagemEntradaDTO dto, Usuario autor, Projeto projeto, List<ArquivoMidia> midias) {
        return Postagem.builder()
                .conteudo(dto.getConteudo())
                .dataPostagem(LocalDateTime.now())
                .autor(autor)
                .arquivos(midias)
                .build();
    }
}
