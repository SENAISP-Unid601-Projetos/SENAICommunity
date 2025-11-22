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

    /**
     * Detecta o resource_type baseado na extensão do nome do arquivo.
     */
    private String detectarResourceTypePeloNome(MultipartFile file) {
        String filename = file.getOriginalFilename();
        if (filename == null || filename.lastIndexOf('.') == -1) {
            return "auto";
        }

        String ext = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();

        return switch (ext) {
            case "jpg", "jpeg", "png", "gif", "webp" -> "image";
            case "mp4", "webm", "mov", "mkv", "avi" -> "video";
            case "mp3", "wav", "ogg" -> "audio";
            default -> "raw";
        };
    }


    public String upload(MultipartFile file) throws IOException {

        String resourceType = detectarResourceTypePeloNome(file);

        if ("video".equals(resourceType)) {
            // Este bloco está correto e bloqueia vídeos ANTES do upload.
            throw new IOException("O upload de vídeos está temporariamente bloqueado devido ao limite de moderação (Google AI Video Moderation). Por favor, envie apenas fotos.");
        }

        Map<String, Object> options = Map.of(
                "resource_type", resourceType,
                "moderation", "manual"
        );

        // ==========================================================
        // ✅ CÓDIGO DE DEPURACÃO ADICIONADO AQUI
        // ==========================================================
        try {
            Map<?, ?> response = cloudinary.uploader().upload(file.getBytes(), options);

            // Imprime a resposta COMPLETA do Cloudinary. Se falhar por autenticação,
            // esta linha pode não ser alcançada, e o bloco 'catch' será ativado.
            System.out.println("✅ DEBUG CLOUDINARY RESPONSE (SUCESSO OU AVISO): " + response);

            if (response == null || !response.containsKey("secure_url")) {
                // Se não houver URL segura (pode ser um upload bem-sucedido, mas malformado),
                // lança um erro.
                throw new IOException("Cloudinary falhou em retornar uma secure_url. Resposta do Cloudinary: " + response);
            }

            return response.get("secure_url").toString();

        } catch (IOException e) {
            // Captura falhas de I/O (como problemas de conexão ou leitura do arquivo).
            System.err.println("❌ ERRO FATAL DE UPLOAD CLOUDINARY (IO): " + e.getMessage());
            // Re-lança para que o UsuarioService saiba que falhou.
            throw new IOException("Falha no upload para o Cloudinary (Verifique Conexão): " + e.getMessage(), e);
        } catch (Exception e) {
            // Captura outras exceções, como autenticação (aqui é o mais provável).
            System.err.println("❌ ERRO INESPERADO NO CLOUDINARY (VERIFIQUE CREDENCIAIS): " + e.getMessage());
            throw new IOException("Erro inesperado durante o upload para o Cloudinary: " + e.getMessage(), e);
        }
        // ==========================================================
    }

    //  MÉTODO AUXILIAR PARA EXTRAIR O ID PÚBLICO DA URL
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

    // Deletar com checagem do retorno
    public boolean deletar(String url) throws IOException {
        String publicId = extrairPublicIdDaUrl(url);
        String resourceType = detectarTipoPelaUrl(url);

        Map<?, ?> result = cloudinary.uploader().destroy(publicId, Map.of("resource_type", resourceType));

        return "ok".equals(result.get("result"));
    }

    // Detecta o tipo baseado na extensão (usado pelo 'deletar')
    public String detectarTipoPelaUrl(String url) {
        String ext = url.substring(url.lastIndexOf('.') + 1).toLowerCase();
        return switch (ext) {
            case "jpg", "jpeg", "png", "gif", "webp" -> "image";
            case "mp4", "webm", "mov" -> "video";
            case "mp3", "wav", "ogg" -> "audio";
            default -> "raw";
        };
    }
}