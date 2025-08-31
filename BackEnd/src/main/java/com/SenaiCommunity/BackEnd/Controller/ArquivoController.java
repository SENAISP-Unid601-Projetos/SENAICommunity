package com.SenaiCommunity.BackEnd.Controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Controller
@RequestMapping("/api/arquivos")
@CrossOrigin(origins = "*") // Lembre-se de configurar o CORS
public class ArquivoController {

    // Injeta o valor da propriedade que definimos no application.properties
    @Value("${file.upload-dir}")
    private String uploadDir;

    @GetMapping("/{nomeArquivo:.+}") // O ':.+' é importante para não truncar a extensão do arquivo
    @ResponseBody
    public ResponseEntity<Resource> servirArquivo(@PathVariable String nomeArquivo) throws IOException {
        // 1. Constrói o caminho completo e seguro para o arquivo
        Path arquivoPath = Paths.get(uploadDir).resolve(nomeArquivo).normalize();
        Resource resource;

        try {
            // 2. Tenta carregar o arquivo como um recurso
            resource = new UrlResource(arquivoPath.toUri());
        } catch (MalformedURLException e) {
            throw new RuntimeException("Erro ao formar a URL do recurso.", e);
        }

        // 3. Verifica se o arquivo realmente existe e pode ser lido
        if (!resource.exists() || !resource.isReadable()) {
            throw new FileNotFoundException("Não foi possível encontrar o arquivo: " + nomeArquivo);
        }

        // 4. Tenta detectar o tipo de conteúdo do arquivo (ex: image/jpeg, image/png)
        String contentType = Files.probeContentType(arquivoPath);
        if (contentType == null) {
            contentType = "application/octet-stream"; // Tipo padrão genérico
        }

        // 5. Retorna a resposta HTTP 200 OK com o tipo de conteúdo correto e o arquivo no corpo
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }
}