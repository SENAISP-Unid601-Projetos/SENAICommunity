package com.SenaiCommunity.BackEnd;

import com.SenaiCommunity.BackEnd.Entity.Professor;
import com.SenaiCommunity.BackEnd.Entity.Role;
import com.SenaiCommunity.BackEnd.Entity.Usuario;
import com.SenaiCommunity.BackEnd.Repository.RoleRepository;
import com.SenaiCommunity.BackEnd.Repository.UsuarioRepository;
import lombok.Data;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;


@SpringBootApplication
public class BackEndApplication {

	public static void main(String[] args) {
		SpringApplication.run(BackEndApplication.class, args);
	}



	@Component
	public class DataInitializer implements CommandLineRunner {

		private final RoleRepository roleRepository;

		public DataInitializer(RoleRepository roleRepository) {
			this.roleRepository = roleRepository;
		}

		@Override
		public void run(String... args) {
			createRoleIfNotFound("ADMIN");
			createRoleIfNotFound("PROFESSOR");
			createRoleIfNotFound("ALUNO");
		}

		private void createRoleIfNotFound(String roleName) {
			if (!roleRepository.existsByNome(roleName)) {
				Role role = new Role();
				role.setNome(roleName);
				roleRepository.save(role);
				System.out.println("Role criada: " + roleName);
			}
		}
	}

	//Metodo para criar um usuario de teste
//	@Bean
//	public CommandLineRunner initTestUser(
//			UsuarioRepository usuarioRepository,
//			PasswordEncoder passwordEncoder
//	) {
//		return args -> {
//			String email = "teste@teste.com";
//			String senha = "senha123";
//
//			if (usuarioRepository.findByEmail(email).isEmpty()) {
//				Professor professorteste = new Professor();
//				professorteste.setEmail(email);
//				professorteste.setSenha(passwordEncoder.encode(senha));
//				usuarioRepository.save(professorteste);
//				System.out.println("Usuário de teste criado: " + email);
//			}
//		};
//	}
}
