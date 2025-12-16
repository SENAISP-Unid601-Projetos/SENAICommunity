package com.SenaiCommunity.BackEnd.Service;

import com.SenaiCommunity.BackEnd.Entity.Evento;
import com.SenaiCommunity.BackEnd.Entity.Usuario;
import com.SenaiCommunity.BackEnd.Repository.EventoRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;

@Component
public class AgendadorEventos {

    @Autowired
    private EventoRepository eventoRepository;

    @Autowired
    private NotificacaoService notificacaoService;

    // Roda a cada 60000 milissegundos (1 minuto)
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void verificarEventos() {
        LocalDate hoje = LocalDate.now();
        LocalTime agora = LocalTime.now(); // Não precisa mais zerar os segundos estritamente

        List<Evento> eventosHoje = eventoRepository.findByData(hoje);

        for (Evento evento : eventosHoje) {

            // 1. Lógica de INÍCIO (Segura)
            // Se já passou da hora de início E ainda não avisamos
            if (!evento.isNotificacaoInicioEnviada() && !agora.isBefore(evento.getHoraInicio())) {

                enviarNotificacaoParaInteressados(evento, "O evento '" + evento.getNome() + "' está começando!", "EVENTO_INICIO");

                // Marca como enviada e salva
                evento.setNotificacaoInicioEnviada(true);
                eventoRepository.save(evento);
            }

            // 2. Lógica de FIM (Segura)
            if (evento.getHoraFim() != null) {
                // Se já passou da hora de fim E ainda não avisamos
                if (!evento.isNotificacaoFimEnviada() && !agora.isBefore(evento.getHoraFim())) {

                    enviarNotificacaoParaInteressados(evento, "O evento '" + evento.getNome() + "' encerrou.", "EVENTO_FIM");

                    evento.setNotificacaoFimEnviada(true);
                    eventoRepository.save(evento);
                }
            }
        }
    }

    private void enviarNotificacaoParaInteressados(Evento evento, String mensagem, String tipo) {
        // A lista de interessados vem da Entidade Evento (baseado no EventoService fornecido)
        Set<Usuario> interessados = evento.getInteressados();

        if (interessados != null && !interessados.isEmpty()) {
            for (Usuario usuario : interessados) {
                // Usa o método existente no seu NotificacaoService
                notificacaoService.criarNotificacao(
                        usuario,
                        mensagem,
                        tipo, // Ex: "EVENTO_INICIO"
                        evento.getId()
                );
            }
            System.out.println("Notificações de " + tipo + " enviadas para o evento: " + evento.getNome());
        }
    }
}