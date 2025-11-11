package com.SenaiCommunity.BackEnd.Exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.BAD_REQUEST)
public class ConteudoImproprioException extends RuntimeException {
    public ConteudoImproprioException(String message) {
        super(message);
    }
}
