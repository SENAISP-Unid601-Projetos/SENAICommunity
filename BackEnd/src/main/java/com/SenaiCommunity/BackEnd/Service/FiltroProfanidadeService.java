package com.SenaiCommunity.BackEnd.Service;

import com.SenaiCommunity.BackEnd.Service.Util.NormalizacaoUtils;
import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.stream.Stream;

@Service
public class FiltroProfanidadeService {

    private static final Set<String> PALAVRAS_PROIBIDAS = Set.of(
            "palavrao", "xingamento", "improprio", "etc"
            // Adicione as palavras normalizadas (sem acento, minúsculas)
    );

    public boolean contemProfanidade(String texto) {
        if (texto == null || texto.isEmpty()) {
            return false;
        }

        String textoNormalizado = NormalizacaoUtils.normalizar(texto);

        return Stream.of(textoNormalizado.split(" "))
                .anyMatch(palavra -> PALAVRAS_PROIBIDAS.contains(palavra.trim()));
    }
}