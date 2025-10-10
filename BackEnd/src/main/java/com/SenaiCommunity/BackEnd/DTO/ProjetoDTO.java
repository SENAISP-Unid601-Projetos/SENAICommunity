package com.SenaiCommunity.BackEnd.DTO;

import com.SenaiCommunity.BackEnd.Entity.ProjetoMembro;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;

@Data
public class ProjetoDTO {
    private Long id;
    private String titulo;
    private String descricao;
    private Date dataInicio;
    private Date dataEntrega;
    private String status;

    private String imagemUrl;
    private LocalDateTime dataCriacao;
    private Integer maxMembros;
    private Boolean grupoPrivado;
    private Integer totalMembros;

    private Long autorId;
    private String autorNome;

    // Manter compatibilidade
    private List<Long> professorIds;
    private List<Long> alunoIds;

    private List<MembroDTO> membros;
    private List<ConviteDTO> convitesPendentes;

    @Data
    public static class MembroDTO {
        private Long id;
        private Long usuarioId;
        private String usuarioNome;
        private String usuarioEmail;
        private String usuarioFotoPerfil;
        private ProjetoMembro.RoleMembro role;
        private LocalDateTime dataEntrada;
        private String convidadoPorNome;
    }

    @Data
    public static class ConviteDTO {
        private Long id;
        private Long usuarioConvidadoId;
        private String usuarioConvidadoNome;
        private String usuarioConvidadoEmail;
        private String convidadoPorNome;
        private LocalDateTime dataConvite;
    }
}
