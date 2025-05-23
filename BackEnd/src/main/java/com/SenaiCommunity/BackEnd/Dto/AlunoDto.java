package com.SenaiCommunity.BackEnd.Dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Data
@EqualsAndHashCode(callSuper = true)
public class AlunoDto extends UsuarioDto {

    private String matricula;
    private String curso;
    private String periodo;
    private String statusConta;

}
