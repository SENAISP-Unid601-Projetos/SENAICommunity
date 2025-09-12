package com.SenaiCommunity.BackEnd.DTO;

import com.SenaiCommunity.BackEnd.Enum.CategoriaEvento;
import com.SenaiCommunity.BackEnd.Enum.FormatoEvento;
import lombok.Data;
import java.time.LocalDate;

@Data
public class EventoSaidaDTO {
    private Long id;
    private String nome;
    private LocalDate data;
    private String local;
    private FormatoEvento formato;
    private CategoriaEvento categoria;
    private String imagemCapaUrl;
}