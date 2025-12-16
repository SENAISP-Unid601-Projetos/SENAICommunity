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
        if (contentType.startsWith("video/") || contentType.startsWith("audio/")) {
            return "video";
        }
        return "auto";
    }

    public String upload(MultipartFile file) throws IOException {

        Map<String, Object> options = new HashMap<>();

        String resourceType = getResourceType(file);
        options.put("resource_type", resourceType);

        // Adiciona pasta para organização (opcional, mas recomendado)
        options.put("folder", "senai_community");

        // --- BLOCO DE MODERAÇÃO REMOVIDO PARA EVITAR ERRO 500 (LIMITE EXCEDIDO) ---
        // Se precisar reativar no futuro, descomente a linha abaixo quando tiver créditos:
        // if ("image".equals(resourceType)) {
        //    options.put("moderation", "webpurify:adult");
        // }
        // --------------------------------------------------------------------------

        Map<?, ?> response;
        try {
            response = cloudinary.uploader().upload(file.getBytes(), options);
        } catch (IOException e) {
            throw new IOException("Falha ao fazer upload da mídia no Cloudinary.", e);
        }

        // Lógica de verificação de resposta (Só será acionada se a moderação estiver ativa)
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

                throw new ConteudoImproprioException("A mídia enviada contém conteúdo impróprio e foi bloqueada.");
            }
        }

        return response.get("secure_url").toString();
    }

    public boolean deletar(String url) throws IOException {
        try {
            String publicId = extrairPublicIdDaUrl(url);
            String resourceType = detectarTipoPelaUrl(url);

            Map<?, ?> result = cloudinary.uploader().destroy(publicId, Map.of("resource_type", resourceType));

            return "ok".equals(result.get("result"));
        } catch (Exception e) {
            // Loga o erro mas não quebra a aplicação se falhar ao deletar (ex: arquivo já não existe)
            System.err.println("Erro ao tentar deletar arquivo: " + e.getMessage());
            return false;
        }
    }

    private String extrairPublicIdDaUrl(String url) {
        try {
            int uploadIndex = url.indexOf("/upload/");
            if (uploadIndex == -1) {
                throw new IllegalArgumentException("URL de Cloudinary inválida: não contém '/upload/'. URL: " + url);
            }
            // Pula "/upload/" e a versão (se houver, ex: v12345678/)
            int publicIdStartIndex = url.indexOf('/', uploadIndex + "/upload/".length()) + 1;

            // Ajuste: as vezes a URL tem versão (v1234..), as vezes não.
            // O Cloudinary geralmente coloca a versão logo após o upload.
            // Se houver uma versão numérica, precisamos pulá-la.
            // Uma estratégia simples é pegar tudo após a última barra antes do nome do arquivo,
            // mas considerando pastas.

            // Simplificação robusta:
            String pathAfterUpload = url.substring(uploadIndex + "/upload/".length());
            if (pathAfterUpload.startsWith("v")) {
                int slashIndex = pathAfterUpload.indexOf('/');
                if (slashIndex != -1) {
                    pathAfterUpload = pathAfterUpload.substring(slashIndex + 1);
                }
            }

            int extensionIndex = pathAfterUpload.lastIndexOf('.');
            if (extensionIndex != -1) {
                return pathAfterUpload.substring(0, extensionIndex);
            }
            return pathAfterUpload;

        } catch (Exception e) {
            throw new RuntimeException("Erro ao extrair Public ID da URL: " + url, e);
        }
    }


    public String detectarTipoPelaUrl(String url) {
        if (url == null || !url.contains(".")) return "raw";
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