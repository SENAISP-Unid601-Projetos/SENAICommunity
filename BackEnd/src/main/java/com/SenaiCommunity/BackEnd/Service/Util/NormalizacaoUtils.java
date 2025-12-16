package com.SenaiCommunity.BackEnd.Service.Util;

import java.text.Normalizer;
import java.util.regex.Pattern;

public class NormalizacaoUtils {

    private static final Pattern ACENTOS_PATTERN = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");

    public static String normalizar(String texto) {
        if (texto == null) {
            return "";
        }

        // 1. Converter para minúsculas primeiro
        String processado = texto.toLowerCase();

        // 2. Substituição de Leet Speak (Trocar números por letras parecidas)
        processado = processado
                .replace("0", "o")
                .replace("1", "i")
                .replace("3", "e")
                .replace("4", "a")
                .replace("5", "s")
                .replace("@", "a");

        // 3. Remover acentos
        processado = Normalizer.normalize(processado, Normalizer.Form.NFD);
        processado = ACENTOS_PATTERN.matcher(processado).replaceAll("");

        return processado.replaceAll("[^a-z\\s]", "");
    }
}