package com.SenaiCommunity.BackEnd.DTO;

import com.SenaiCommunity.BackEnd.Entity.ProjetoMembro; // Importar RoleMembro
import lombok.Data; // Importar @Data do Lombok

import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;

@Data // Usa Lombok para getters, setters, etc.
public class ProjetoDTO {

    // --- Campos do Projeto Principal ---
    private Long id;
    private String titulo;
    private String descricao;
    private Date dataInicio;
    private Date dataEntrega;
    private String status; // Ex: PLANEJADO, EM_ANDAMENTO, CONCLUIDO
    private String imagemUrl; // Nome do arquivo da imagem
    private LocalDateTime dataCriacao;
    private Integer maxMembros;
    private Boolean grupoPrivado;
    private Integer totalMembros; // Calculado no service

    // --- Informações do Autor ---
    private Long autorId;
    private String autorNome;

    // --- Novos Campos Adicionados ---
    private List<String> linksUteis; // Lista de links úteis

    // --- IDs para Convites Iniciais (manter compatibilidade) ---
    private List<Long> professorIds;
    private List<Long> alunoIds;

    // --- Listas de Membros e Convites ---
    private List<MembroDTO> membros;
    private List<ConviteDTO> convitesPendentes;

    // --- Classe Interna para Membros ---
    @Data // Usa Lombok para getters, setters, etc.
    public static class MembroDTO {
        private Long id; // ID da entidade ProjetoMembro
        private Long usuarioId;
        private String usuarioNome;
        private String usuarioEmail;

        // ✅ --- CAMPO ADICIONADO PARA CORRIGIR O ERRO --- ✅
        private String usuarioFotoUrl; // URL completa da foto do membro
        // --- FIM DA ADIÇÃO ---

        private ProjetoMembro.RoleMembro role; // ADMIN, MODERADOR, MEMBRO
        private LocalDateTime dataEntrada;
        private String convidadoPorNome; // Nome de quem convidou
    }

    // --- Classe Interna para Convites Pendentes ---
    @Data // Usa Lombok para getters, setters, etc.
    public static class ConviteDTO {
        private Long id; // ID da entidade ConviteProjeto
        private Long usuarioConvidadoId;
        private String usuarioConvidadoNome;
        private String usuarioConvidadoEmail;
        private String convidadoPorNome;
        private LocalDateTime dataConvite;
    }
}