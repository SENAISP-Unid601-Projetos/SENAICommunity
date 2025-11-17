package com.SenaiCommunity.BackEnd.DTO;

import jakarta.persistence.Lob;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class MensagemGrupoEntradaDTO {
    @Lob
    private String conteudo;

    private List<AnexoDTO> anexos;

    public static class AnexoDTO {
        private String url;
        private String type;
        public String getUrl() { return url; }
        public void setUrl(String url) { this.url = url; }
    }
}
