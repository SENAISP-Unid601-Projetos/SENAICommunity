package com.SenaiCommunity.BackEnd.Dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class ProfessorDto extends UsuarioDto {
    private String formacao;
    private String areaAtuacao;
    private String codigoSn;
}
