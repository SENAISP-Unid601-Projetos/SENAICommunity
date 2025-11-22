package com.SenaiCommunity.BackEnd.DTO;

import com.SenaiCommunity.BackEnd.Entity.Supervisor;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
public class SupervisorSaidaDTO extends UsuarioSaidaDTO {
    public SupervisorSaidaDTO(Supervisor supervisor) {
        super(supervisor);
    }
}