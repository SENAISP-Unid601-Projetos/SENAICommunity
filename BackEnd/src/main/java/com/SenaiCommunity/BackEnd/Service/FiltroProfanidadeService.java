package com.SenaiCommunity.BackEnd.Service;

import com.SenaiCommunity.BackEnd.Service.Util.NormalizacaoUtils;
import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class FiltroProfanidadeService {

    private static final Set<String> PALAVRAS_RAIZ = Set.of(
            "puta", "puto", "putão", "putinha", "putona", "pqp",
            "puta que pariu", "putifera", "prostituta", "prostiranha",
            "arrombado", "arrombada", "arrombadinho", "arrombadão", "arrombadu",
            "merda", "merdinha", "merdão", "bosta", "bostinha", "bostão", "cu",
            "cuzão", "cuzao", "cuzinho", "cuzuda", "caralho", "krl", "kralho",
            "caralhinho", "caralhão", "cacete", "kacete", "cct", "cacetinho",
            "cacetão", "corno", "cornudo", "corninho", "cornão", "cornomanso",
            "desgracado", "desgraça", "desgraçado", "desgraçadinho", "dgr",
            "boyceta", "piranha", "piranhona", "piranhazinha", "vagabundo",
            "vagabunda", "vgb", "vagabundinho", "vagabundona", "foda", "foda-se",
            "fds", "vsf", "vai se foder", "foder", "fodeu", "fudido", "fudida",
            "fodido", "fodida", "fudidão", "fudidinho", "fudeu", "fudendo",
            "filho da puta", "fdp", "filho da putinha", "viado",
            "viadinho", "viadão", "gay", "guei", "gayzinho", "baitola",
            "boquete", "boquetinho", "boquetão", "boceta", "buceta", "bct",
            "bucetinha", "bucetão", "bucetuda", "escroto", "escrota",
            "escrotinho", "escrotão", "xereca", "xerequinha",
            "chupador", "chupadora", "chupetinha", "babaca", "otário", "otaria",
            "otarião", "retardado", "retardada", "retardadinho", "pal", "pauzão",
            "pauzinho", "pica", "picão", "piquinha", "rola", "rolinha", "rolão",
            "trouxa", "trouxão", "siririca", "punheta", "punheteiro", "punhetinha",
            "grelinho", "miserável", "burro", "burra", "burrão", "burrinho", "imbecil",
            "idiota", "idiotice", "canalha", "canalhão", "safado", "safada", "safadinho",
            "safadão", "cadela", "vadia", "vadiazinha", "xoxota", "xoxotinha", "xoxotão",
            "precheca", "ppk", "rabão", "rabo", "rabinho", "rabuda", "boiola", "boiolinha",
            "rapariga", "lazarento", "inútil", "meretriz", "quenga", "biscate", "mocorongo",
            "paspalho", "nojento", "nojenta", "nojentinho", "imundo", "fedorento", "lixo",
            "verme", "chifrudo", "chifrudinho", "chifrudão", "galinha", "piriguete", "vtnc",
            "vai tomar no cu", "tmnc", "vtmnc", "tnc", "gorda", "gordo", "gordinha", "gordão",
            "gordinho", "rolha de poço", "negrinho",
            "neguinho"
    );

    private static final Pattern PADRAO_PROFANIDADE;

    static {
        Set<String> raizesNormalizadas = PALAVRAS_RAIZ.stream()
                .map(NormalizacaoUtils::normalizar)
                .collect(Collectors.toSet());

        String regex = raizesNormalizadas.stream()
                .map(raiz -> "\\b" + Pattern.quote(raiz)) // \b = Limite de Palavra
                .collect(Collectors.joining("|")); // | = OU

        PADRAO_PROFANIDADE = Pattern.compile(regex);
    }

    /**
     *
     * @param texto Texto a verificar
     * @return true se houver profanidade; false caso contrário
     */
    public boolean contemProfanidade(String texto) {
        if (texto == null || texto.isBlank()) {
            return false;
        }

        String textoNormalizado = NormalizacaoUtils.normalizar(texto);

        Matcher matcher = PADRAO_PROFANIDADE.matcher(textoNormalizado);

        return matcher.find();
    }
}