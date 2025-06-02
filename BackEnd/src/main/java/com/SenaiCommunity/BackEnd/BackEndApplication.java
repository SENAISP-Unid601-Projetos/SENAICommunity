package com.SenaiCommunity.BackEnd;

import com.SenaiCommunity.BackEnd.Entity.Professor;
import com.SenaiCommunity.BackEnd.Entity.Usuario;
import com.SenaiCommunity.BackEnd.Repository.UsuarioRepository;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;


@SpringBootApplication
public class BackEndApplication {

	public static void main(String[] args) {
		SpringApplication.run(BackEndApplication.class, args);
	}

	@Bean
	public CommandLineRunner initTestUser(
			UsuarioRepository usuarioRepository,
			PasswordEncoder passwordEncoder
	) {
		return args -> {
			String email = "teste@teste.com";
			String senha = "senha123";

			if (usuarioRepository.findByEmail(email).isEmpty()) {
				Professor professorteste = new Professor();
				professorteste.setEmail(email);
				professorteste.setSenha(passwordEncoder.encode(senha));
				usuarioRepository.save(professorteste);
				System.out.println("Usuário de teste criado: " + email);
			}
		};
	}

}
