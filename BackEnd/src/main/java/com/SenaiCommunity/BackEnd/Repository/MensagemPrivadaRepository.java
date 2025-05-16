package com.SenaiCommunity.BackEnd.Repository;

import com.SenaiCommunity.BackEnd.Entity.MensagemPrivada;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.SenaiCommunity.BackEnd.Entity.MensagemPrivada;
import com.SenaiCommunity.BackEnd.Entity.ChatPrivado;
import com.SenaiCommunity.BackEnd.Entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

@Repository
public interface MensagemPrivadaRepository extends JpaRepository<MensagemPrivada, Long> {
    List<MensagemPrivada> findByChat(ChatPrivado chat);
    List<MensagemPrivada> findByRemetenteAndDestinatario(Usuario remetente, Usuario destinatario);
    List<MensagemPrivada> findByDestinatario(Usuario destinatario);
}
