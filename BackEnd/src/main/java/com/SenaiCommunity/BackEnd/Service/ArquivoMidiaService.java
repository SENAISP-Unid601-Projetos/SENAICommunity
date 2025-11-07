package com.SenaiCommunity.BackEnd.Service;

import com.SenaiCommunity.BackEnd.Exception.ConteudoImproprioException;
import com.cloudinary.Cloudinary;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ArquivoMidiaService {

    @Autowired
    private Cloudinary cloudinary;

    public String upload(MultipartFile file) throws IOException {

        Map<String, Object> options = new HashMap<>();
        options.put("resource_type", "auto");

        options.put("moderation", "aws_rekognition_moderation:min_confidence:80");

        Map<?, ?> response;
        try {
            response = cloudinary.uploader().upload(file.getBytes(), options);
        } catch (IOException e) {
            throw new IOException("Falha ao fazer upload da mídia.", e);
        }

        List<Map<String, Object>> moderationList = (List<Map<String, Object>>) response.get("moderation");

        if (moderationList != null && !moderationList.isEmpty()) {
            Map<String, Object> moderationData = moderationList.get(0);
            String status = (String) moderationData.get("status");

            if ("rejected".equals(status)) {

                String publicId = (String) response.get("public_id");
                String resourceType = (String) response.get("resource_type");

                System.err.println("[MODERAÇÃO] Conteúdo REJEITADO detectado. Deletando: " + publicId);

                try {
                    // Tenta deletar o arquivo rejeitado
                    cloudinary.uploader().destroy(publicId, Map.of("resource_type", resourceType));
                } catch (IOException e) {
                    System.err.println("[MODERAÇÃO] Falha ao deletar arquivo rejeitado: " + publicId);
                }

                throw new ConteudoImproprioException("A mídia enviada contém conteúdo impróprio e foi bloqueada.");
            }
        }

        // Se passou, retorna a URL segura
        return response.get("secure_url").toString();
    }

    // Deletar com checagem do retorno
    public boolean deletar(String url) throws IOException {
        String publicId = extrairPublicIdDaUrl(url);
        String resourceType = detectarTipoPelaUrl(url);

        Map<?, ?> result = cloudinary.uploader().destroy(publicId, Map.of("resource_type", resourceType));

        return "ok".equals(result.get("result")); // true se deletado, false se não encontrado
    }
    private String extrairPublicIdDaUrl(String url) {
        try {
            // Encontra a parte da URL que começa depois de "/upload/"
            int uploadIndex = url.indexOf("/upload/");
            if (uploadIndex == -1) {
                throw new IllegalArgumentException("URL de Cloudinary inválida: não contém '/upload/'. URL: " + url);
            }

            int publicIdStartIndex = url.indexOf('/', uploadIndex + "/upload/".length()) + 1;

            int publicIdEndIndex = url.lastIndexOf('.');

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
