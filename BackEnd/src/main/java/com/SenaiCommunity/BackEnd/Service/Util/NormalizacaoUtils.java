package com.SenaiCommunity.BackEnd.Service.Util;

import java.text.Normalizer;
import java.util.regex.Pattern;

public class NormalizacaoUtils {

    private static final Pattern ACENTOS_PATTERN = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");

    /**
     * Remove acentos, pontuação e converte para minúsculas.
     * Ex: "Olá, TUDO BEM?" -> "ola tudo bem"
     */
    public static String normalizar(String texto) {
        if (texto == null) {
            return "";
        }

        String textoNormalizado = Normalizer.normalize(texto, Normalizer.Form.NFD);
        textoNormalizado = ACENTOS_PATTERN.matcher(textoNormalizado).replaceAll("");

        return textoNormalizado
                .toLowerCase()
                .replaceAll("[^a-z0-9\\s]", ""); // Remove tudo exceto letras, números e espaços
    }
}
