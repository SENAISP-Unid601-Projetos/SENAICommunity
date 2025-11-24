package com.SenaiCommunity.BackEnd.DTO;

import com.SenaiCommunity.BackEnd.Enum.CategoriaEvento;
import com.SenaiCommunity.BackEnd.Enum.FormatoEvento;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class EventoEntradaDTO {
    private String nome;
    private LocalDate data;
    private String descricao;
    private LocalTime horaInicio; // NOVO
    private LocalTime horaFim;    // NOVO
    private String local;
    private FormatoEvento formato;
    private CategoriaEvento categoria;
}