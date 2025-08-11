package com.SenaiCommunity.BackEnd.Service;

import com.cloudinary.Cloudinary;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
public class ArquivoMidiaService {

    @Autowired
    private Cloudinary cloudinary;

    public String upload(MultipartFile file) throws IOException {
        Map<?, ?> response = cloudinary.uploader().upload(file.getBytes(), Map.of());
        return response.get("secure_url").toString();
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
