package com.SenaiCommunity.BackEnd.Service;

import com.SenaiCommunity.BackEnd.Exception.ConteudoImproprioException;
import com.cloudinary.Cloudinary;
import org.springframework.beans.factory.annotation.Autowired;
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


    private String getResourceType(MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType == null) {
            return "auto";
        }
        if (contentType.startsWith("image/")) {
            return "image";
        }
        if (contentType.startsWith("video/")) {
            return "video";
        }
        if (contentType.startsWith("audio/")) {
            return "audio";
        }
        return "auto";
    }

    public String upload(MultipartFile file) throws IOException {

        Map<String, Object> options = new HashMap<>();

        String resourceType = getResourceType(file);

        options.put("resource_type", resourceType);

        if ("image".equals(resourceType)) {

            options.put("moderation", "webpurify:adult");

        } else if ("video".equals(resourceType)) {

            options.put("moderation", "google_video_moderation:min_confidence:80");
        }

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

                String respResourceType = (String) response.get("resource_type");

                System.err.println("[MODERAÇÃO] Conteúdo REJEITADO detectado. Deletando: " + publicId);

                try {
                    cloudinary.uploader().destroy(publicId, Map.of("resource_type", respResourceType));
                } catch (IOException e) {
                    System.err.println("[MODERAÇÃO] Falha ao deletar arquivo rejeitado: " + publicId);
                }

                throw new ConteudoImproprioException("A mídia enviada (imagem ou vídeo) contém conteúdo impróprio e foi bloqueada.");
            }
        }

        return response.get("secure_url").toString();
    }

    public boolean deletar(String url) throws IOException {
        String publicId = extrairPublicIdDaUrl(url);
        String resourceType = detectarTipoPelaUrl(url);

        Map<?, ?> result = cloudinary.uploader().destroy(publicId, Map.of("resource_type", resourceType));

        return "ok".equals(result.get("result"));
    }

    private String extrairPublicIdDaUrl(String url) {
        try {
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
            throw new RuntimeException("Erro ao extrair Public ID da URL: " + url, e);
        }
    }


    public String detectarTipoPelaUrl(String url) {
        String ext = url.substring(url.lastIndexOf('.') + 1).toLowerCase();
        return switch (ext) {
            // Imagens
            case "jpg", "jpeg", "png", "gif", "webp", "bmp", "tiff", "ico", "svg",
                    "heic", "heif", "avif", "jxr", "wdp", "jp2" -> "image";

            // Vídeos
            case "mp4", "webm", "mov", "avi", "mkv", "flv", "wmv", "3gp",
                    "ogv", "m3u8", "ts", "asf" -> "video";

            // Áudio
            case "mp3", "wav", "ogg", "aac", "flac", "m4a", "opus" -> "audio";

            default -> "raw";
        };
    }
}