package com.SenaiCommunity.BackEnd.Controller;

import com.SenaiCommunity.BackEnd.DTO.AlunoEntradaDTO;
import com.SenaiCommunity.BackEnd.DTO.AlunoSaidaDTO;
import com.SenaiCommunity.BackEnd.DTO.ProfessorEntradaDTO;
import com.SenaiCommunity.BackEnd.DTO.ProfessorSaidaDTO;
import com.SenaiCommunity.BackEnd.Service.AlunoService;
import com.SenaiCommunity.BackEnd.Service.ProfessorService;
import io.swagger.v3.oas.annotations.Operation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.SenaiCommunity.BackEnd.DTO.UsuarioLoginDTO;
import com.SenaiCommunity.BackEnd.Security.JWTUtil;
import com.SenaiCommunity.BackEnd.Service.UsuarioDetailsImpl;
import com.SenaiCommunity.BackEnd.Service.UsuarioDetailsService;
import com.SenaiCommunity.BackEnd.DTO.TokenDTO;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.SenaiCommunity.BackEnd.Entity.Aluno;
import com.SenaiCommunity.BackEnd.Entity.Role;
import com.SenaiCommunity.BackEnd.Service.UsuarioService;
import com.SenaiCommunity.BackEnd.Repository.RoleRepository;
import com.SenaiCommunity.BackEnd.Repository.UsuarioRepository;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Map;
import java.util.Set;
import java.util.UUID;


@RestController
@RequestMapping("/autenticacao")
public class AutenticacaoController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UsuarioDetailsService userDetailsService;

    @Autowired
    private JWTUtil jwtUtil;

    @Autowired
    private UsuarioService usuarioService;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private UsuarioRepository usuarioRepository;
    @Value("${google.clientId}")
    private String googleClientId;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody UsuarioLoginDTO dto) {
        if (dto.getEmail() == null || dto.getSenha() == null) {
            return ResponseEntity.badRequest().body("Email e senha são obrigatórios");
        }

        try {
            // 1. Autenticar
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(dto.getEmail(), dto.getSenha())
            );

            UserDetails userDetails = userDetailsService.loadUserByUsername(dto.getEmail());

            // Pegando o id
            Long id = ((UsuarioDetailsImpl) userDetails).getId();

            // Gerar token com ID como claim personalizada
            String token = jwtUtil.gerarToken(userDetails, id);

            // 4. Retornar token no body
            return ResponseEntity.ok(new TokenDTO(token));
        } catch (Exception e) {
            return ResponseEntity.status(401).body("Credenciais inválidas");
        }
    }

    @PostMapping("/login/google")
    public ResponseEntity<?> loginComGoogle(@RequestBody TokenDTO tokenDto) {
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(tokenDto.token());
            if (idToken == null) {
                return ResponseEntity.badRequest().body("Token de ID do Google inválido.");
            }

            GoogleIdToken.Payload payload = idToken.getPayload();
            String email = payload.getEmail();
            String nome = (String) payload.get("name");

            // 1. Buscar ou criar o usuário
            UserDetails userDetails;
            Long id;
            try {
                // Tenta encontrar o usuário existente
                userDetails = userDetailsService.loadUserByUsername(email);
                id = ((UsuarioDetailsImpl) userDetails).getId();
            } catch (UsernameNotFoundException e) {
                // Se não existir, cria um novo usuário
                Aluno novoAluno = new Aluno();
                novoAluno.setNome(nome);
                novoAluno.setEmail(email);
                // Gera uma senha aleatória para evitar que o campo seja nulo
                String senhaAleatoria = passwordEncoder.encode(UUID.randomUUID().toString());
                novoAluno.setSenha(senhaAleatoria);
                novoAluno.setDataCadastro(LocalDateTime.now());
                novoAluno.setTipoUsuario("ALUNO");

                Role roleAluno = roleRepository.findByNome("ALUNO")
                        .orElseThrow(() -> new RuntimeException("Role ALUNO não encontrada"));
                novoAluno.setRoles(Set.of(roleAluno));

                // Salva o novo usuário no banco de dados
                usuarioRepository.save(novoAluno);

                // Recarrega o userDetails com o novo usuário
                userDetails = userDetailsService.loadUserByUsername(email);
                id = novoAluno.getId();
            }

            // 2. Gerar o token JWT para o usuário
            String jwt = jwtUtil.gerarToken(userDetails, id);

            // 3. Retornar o token
            return ResponseEntity.ok(new TokenDTO(jwt));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Erro ao processar o login com Google: " + e.getMessage());
        }
    }
}