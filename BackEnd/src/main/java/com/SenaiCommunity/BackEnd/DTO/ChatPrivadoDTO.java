package com.SenaiCommunity.BackEnd.DTO;

import com.SenaiCommunity.BackEnd.Entity.Aluno;
import com.SenaiCommunity.BackEnd.Entity.Professor;
import lombok.Data;

@Data
public class ChatPrivadoDTO {
    private long id;
    private Aluno aluno;
    private Professor professor;
}
