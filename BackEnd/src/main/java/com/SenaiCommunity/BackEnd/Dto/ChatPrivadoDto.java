package com.SenaiCommunity.BackEnd.Dto;

import com.SenaiCommunity.BackEnd.Entity.Aluno;
import com.SenaiCommunity.BackEnd.Entity.Professor;
import lombok.Data;

@Data
public class ChatPrivadoDto {
    private Aluno aluno;
    private Professor professor;
}
