package com.SenaiCommunity.BackEnd.Service;

import com.SenaiCommunity.BackEnd.Entity.*;
import com.SenaiCommunity.BackEnd.Repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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

    public Postagem salvarPostagem(Postagem postagem) {
        Usuario autor = usuarioRepository.findByEmail(postagem.getAutorUsername())
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        postagem.setAutor(autor);
        return postagemRepository.save(postagem);
    }
}
