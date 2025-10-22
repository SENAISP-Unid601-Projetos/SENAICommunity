// Pacote: com.SenaiCommunity.BackEnd.DTO (ou onde seus DTOs ficam)
package com.SenaiCommunity.BackEnd.DTO;

import lombok.Data;
import java.util.List;

@Data // Lombok para getters/setters/etc.
public class MensagemProjetoEdicaoDTO {
    private String conteudo;
    private List<String> urlsParaRemover;
}