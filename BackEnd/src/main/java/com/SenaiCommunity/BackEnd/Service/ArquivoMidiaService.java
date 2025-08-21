package com.SenaiCommunity.BackEnd.Service;

import com.cloudinary.Cloudinary;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value; // ✅ IMPORTAR
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
public class ArquivoMidiaService {

    @Autowired
    private Cloudinary cloudinary;

    // ✅ INJETAR OS VALORES DIRETAMENTE PARA TESTE
    @Value("${cloudinary.cloud-name}")
    private String cloudName;
    @Value("${cloudinary.api-key}")
    private String apiKey;
    @Value("${cloudinary.api-secret}")
    private String apiSecret;

    public String upload(MultipartFile file) throws IOException {
        // ✅ ADICIONAR LOGS PARA VER AS CREDENCIAIS EM USO
        System.out.println("--- USANDO CREDENCIAIS CLOUDINARY ---");
        System.out.println("Cloud Name: " + cloudName);
        System.out.println("API Key: " + apiKey);
        System.out.println("------------------------------------");

        Map<String, Object> options = Map.of(
                "resource_type", getResourceType(file)
        );
        Map<?, ?> response = cloudinary.uploader().upload(file.getBytes(), options);
        return response.get("secure_url").toString();
    }

    private String getResourceType(MultipartFile file) {
        String contentType = file.getContentType();

        // Se o navegador não informar o tipo, deixe o Cloudinary descobrir sozinho.
        if (contentType == null) {
            return "auto";
        }

        if (contentType.startsWith("video")) {
            return "video";
        }
        if (contentType.startsWith("audio")) {
            return "audio";
        }
        // Para qualquer outro caso (incluindo imagens), "auto" é a opção mais segura.
        return "auto";
    }


    public String detectarTipoPelaUrl(String url) {
        String ext = url.substring(url.lastIndexOf('.') + 1).toLowerCase();
        return switch (ext) {
            case "jpg", "jpeg", "png", "gif", "webp" -> "imagem";
            case "mp4", "webm", "mov" -> "video";
            case "mp3", "wav", "ogg" -> "audio";
            default -> "outro";
        };
    }
}