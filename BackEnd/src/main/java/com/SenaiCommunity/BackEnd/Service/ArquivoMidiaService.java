package com.SenaiCommunity.BackEnd.Service;

import com.cloudinary.Cloudinary;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
public class ArquivoMidiaService {

    @Autowired
    private Cloudinary cloudinary;


    public String upload(MultipartFile file) throws IOException {

        Map<String, Object> options = Map.of(
                "resource_type", "auto"
        );

        Map<?, ?> response = cloudinary.uploader().upload(file.getBytes(), options);
        return response.get("secure_url").toString();
    }

    // Deletar com checagem do retorno
    public boolean deletar(String url) throws IOException {
        String publicId = extrairPublicIdDaUrl(url);
        String resourceType = detectarTipoPelaUrl(url);

        Map<?, ?> result = cloudinary.uploader().destroy(publicId, Map.of("resource_type", resourceType));

        return "ok".equals(result.get("result")); // true se deletado, false se não encontrado
    }


    //  MÉTODO AUXILIAR PARA EXTRAIR O ID PÚBLICO DA URL
    private String extrairPublicIdDaUrl(String url) {
        try {
            // Encontra a parte da URL que começa depois de "/upload/"
            int uploadIndex = url.indexOf("/upload/");
            if (uploadIndex == -1) {
                throw new IllegalArgumentException("URL de Cloudinary inválida: não contém '/upload/'. URL: " + url);
            }

            // Encontra o início do public_id, que fica depois do componente de versão (ex: /v1234567/)
            // O +1 é para pular a barra "/"
            int publicIdStartIndex = url.indexOf('/', uploadIndex + "/upload/".length()) + 1;

            // Encontra o fim do public_id, que é no último ponto (antes da extensão do arquivo)
            int publicIdEndIndex = url.lastIndexOf('.');

            // Validação para garantir que os índices são válidos
            if (publicIdStartIndex == 0 || publicIdEndIndex == -1 || publicIdEndIndex <= publicIdStartIndex) {
                throw new IllegalArgumentException("Não foi possível extrair o Public ID da URL: " + url);
            }

            return url.substring(publicIdStartIndex, publicIdEndIndex);

        } catch (Exception e) {
            // Captura qualquer erro de parsing da URL e o encapsula
            throw new RuntimeException("Erro ao extrair Public ID da URL: " + url, e);
        }
    }

    // Detecta o tipo baseado na extensão, mas já retorna no padrão do Cloudinary
    public String detectarTipoPelaUrl(String url) {
        String ext = url.substring(url.lastIndexOf('.') + 1).toLowerCase();
        return switch (ext) {
            case "jpg", "jpeg", "png", "gif", "webp" -> "image";
            case "mp4", "webm", "mov" -> "video";
            case "mp3", "wav", "ogg" -> "audio";
            default -> "raw"; // Cloudinary usa "raw" para docs, zip, pdf, etc.
        };
    }
}
