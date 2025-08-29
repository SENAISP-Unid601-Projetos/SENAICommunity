package com.SenaiCommunity.BackEnd.DTO;

<<<<<<< HEAD
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class PostagemEntradaDTO {
    private String conteudo;
    private Long projetoId;
    private List<String> urlsMidia;


}
=======
import lombok.Data;
import java.util.List;

@Data

public class PostagemEntradaDTO {
    private String conteudo;
    private Long projetoId;
    private List<String> urlsParaRemover;
}
>>>>>>> back
