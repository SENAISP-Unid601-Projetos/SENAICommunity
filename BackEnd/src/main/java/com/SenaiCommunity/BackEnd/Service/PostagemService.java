package com.SenaiCommunity.BackEnd.Service;

import com.SenaiCommunity.BackEnd.DTO.PostagemEntradaDTO;
import com.SenaiCommunity.BackEnd.DTO.PostagemSaidaDTO;
import com.SenaiCommunity.BackEnd.Entity.ArquivoMidia;
import com.SenaiCommunity.BackEnd.Entity.Postagem;
import com.SenaiCommunity.BackEnd.Entity.Usuario;
import com.SenaiCommunity.BackEnd.Repository.PostagemRepository;
import com.SenaiCommunity.BackEnd.Repository.UsuarioRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
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

    @Transactional
    public PostagemSaidaDTO criarPostagem(String autorUsername, PostagemEntradaDTO dto, List<MultipartFile> arquivos) {
        Usuario autor = usuarioRepository.findByEmail(autorUsername)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        // Lógica de conversão DTO -> Entidade
        Postagem novaPostagem = toEntity(dto, autor);

        // Processa os arquivos de mídia, se existirem
        if (arquivos != null && !arquivos.isEmpty()) {
            List<ArquivoMidia> midias = new ArrayList<>();
            for (MultipartFile file : arquivos) {
                try {
                    String url = midiaService.upload(file);
                    ArquivoMidia midia = ArquivoMidia.builder()
                            .url(url)
                            .tipo(midiaService.detectarTipoPelaUrl(url))
                            .postagem(novaPostagem) // Associa a mídia à postagem
                            .build();
                    midias.add(midia);
                } catch (IOException e) {
                    throw new RuntimeException("Erro ao fazer upload do arquivo: " + file.getOriginalFilename(), e);
                }
            }
            novaPostagem.setArquivos(midias);
        }

        Postagem postagemSalva = postagemRepository.save(novaPostagem);
        return toDTO(postagemSalva);
    }

    @Transactional
    public PostagemSaidaDTO editarPostagem(Long id, String username, PostagemEntradaDTO dto, List<MultipartFile> novosArquivos) {
        Postagem postagem = buscarPorId(id);

        if (!postagem.getAutor().getEmail().equals(username)) {
            throw new SecurityException("Você não pode editar esta postagem.");
        }

        // 1. Atualiza o conteúdo do texto
        postagem.setConteudo(dto.getConteudo());

        // 2. Remove arquivos antigos, se solicitado
        if (dto.getUrlsMidia() != null && !dto.getUrlsMidia().isEmpty()) {
            List<ArquivoMidia> arquivosParaRemover = new ArrayList<>();
            for (String url : dto.getUrlsMidia()) {
                postagem.getArquivos().stream()
                        .filter(midia -> midia.getUrl().equals(url))
                        .findFirst()
                        .ifPresent(arquivosParaRemover::add);
            }

            for (ArquivoMidia midia : arquivosParaRemover) {
                try {
                    midiaService.deletar(midia.getUrl());
                    postagem.getArquivos().remove(midia);
                } catch (IOException e) {
                    System.err.println("Erro ao deletar arquivo do Cloudinary: " + midia.getUrl());
                }
            }
        }

        // 3. Adiciona novos arquivos, se enviados
        if (novosArquivos != null && !novosArquivos.isEmpty()) {
            for (MultipartFile file : novosArquivos) {
                try {
                    String url = midiaService.upload(file);
                    ArquivoMidia midia = ArquivoMidia.builder()
                            .url(url)
                            .tipo(midiaService.detectarTipoPelaUrl(url))
                            .postagem(postagem)
                            .build();
                    postagem.getArquivos().add(midia);
                } catch (IOException e) {
                    throw new RuntimeException("Erro ao fazer upload do novo arquivo: " + file.getOriginalFilename(), e);
                }
            }
        }

        Postagem atualizada = postagemRepository.save(postagem);
        return toDTO(atualizada);
    }

    @Transactional
    public void excluirPostagem(Long id, String username) {
        Postagem postagem = buscarPorId(id);

        if (!postagem.getAutor().getEmail().equals(username)) {
            throw new SecurityException("Você não pode excluir esta postagem.");
        }

        // Deleta os arquivos associados no Cloudinary
        if (postagem.getArquivos() != null && !postagem.getArquivos().isEmpty()) {
            // Itera sobre uma cópia da lista para evitar problemas de modificação concorrente
            for (ArquivoMidia midia : new ArrayList<>(postagem.getArquivos())) {
                try {
                    midiaService.deletar(midia.getUrl());
                } catch (Exception e) {
                    // Loga o erro mas continua o processo para não impedir a exclusão no banco
                    System.err.println("AVISO: Falha ao deletar arquivo no Cloudinary: " + midia.getUrl() + ". Erro: " + e.getMessage());
                }
            }
        }

        // Deleta a postagem do banco de dados
        postagemRepository.deleteById(id);
    }

    public List<PostagemSaidaDTO> buscarPostagensPublicas() {
        List<Postagem> posts = postagemRepository.findTop50ByOrderByDataPostagemDesc();

        // Converte cada Postagem da lista para um PostagemSaidaDTO
        return posts.stream()
                .map(this::toDTO) // Usa o método de conversão que você já tem!
                .collect(Collectors.toList());
    }

    public Postagem buscarPorId(Long id) {
        return postagemRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Postagem não encontrada"));
    }

    // Lógica de conversão Entidade -> DTO de Saída
    private PostagemSaidaDTO toDTO(Postagem postagem) {
        List<String> urls = postagem.getArquivos() != null
                ? postagem.getArquivos().stream().map(ArquivoMidia::getUrl).collect(Collectors.toList())
                : Collections.emptyList();

        return PostagemSaidaDTO.builder()
                .id(postagem.getId())
                .conteudo(postagem.getConteudo())
                .dataCriacao(postagem.getDataPostagem())
                .autorId(postagem.getAutor().getId())
                .nomeAutor(postagem.getAutor().getNome())
                .urlsMidia(urls)
                .build();
    }

    // Lógica de conversão DTO de Entrada -> Entidade
    private Postagem toEntity(PostagemEntradaDTO dto, Usuario autor) {
        return Postagem.builder()
                .conteudo(dto.getConteudo())
                .dataPostagem(LocalDateTime.now())
                .autor(autor)
                .build();
    }
}