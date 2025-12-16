package com.SenaiCommunity.BackEnd.DTO;

import com.SenaiCommunity.BackEnd.Enum.CategoriaEvento;
import com.SenaiCommunity.BackEnd.Enum.FormatoEvento;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class EventoSaidaDTO {
    private Long id;
    private String nome;
    private LocalDate data;
    private String local;
    private String descricao;
    private FormatoEvento formato;
    private CategoriaEvento categoria;
    private String imagemCapaUrl;
    private LocalTime horaInicio; // NOVO
    private LocalTime horaFim;
    private int numeroInteressados;
}