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

import java.time.LocalDateTime;
import java.util.Set;


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

	@Bean
	public CommandLineRunner initTestUsers(
			UsuarioRepository usuarioRepository,
			RoleRepository roleRepository,
			PasswordEncoder passwordEncoder
	) {
		return args -> {
//
//			// --- 1. Criar Usuário PROFESSOR (prof@teste.com) ---
//			String profEmail = "prof@teste.com";
//			if (usuarioRepository.findByEmail(profEmail).isEmpty()) {
//
//				Role roleProfessor = roleRepository.findByNome("PROFESSOR")
//						.orElseThrow(() -> new RuntimeException("Role PROFESSOR não encontrada"));
//
//				Professor professorTeste = new Professor();
//				professorTeste.setNome("Professor Teste");
//				professorTeste.setEmail(profEmail);
//				professorTeste.setSenha(passwordEncoder.encode("senha123"));
//				professorTeste.setTipoUsuario("PROFESSOR");
//				professorTeste.setDataCadastro(LocalDateTime.now());
//				professorTeste.setRoles(Set.of(roleProfessor));
//
//				usuarioRepository.save(professorTeste);
//				System.out.println("==================================================");
//				System.out.println("Usuário PROFESSOR de teste criado: " + profEmail);
//				System.out.println("Senha: senha123");
//				System.out.println("==================================================");
//			}
//
//			 --- 2. Criar Usuário ADMIN (admin@teste.com) ---
			String adminEmail = "admin@teste.com";
			if (usuarioRepository.findByEmail(adminEmail).isEmpty()) {

				// Busca AMBAS as roles
				Role roleAdmin = roleRepository.findByNome("ADMIN")
						.orElseThrow(() -> new RuntimeException("Role ADMIN não encontrada"));
				Role roleProfessor = roleRepository.findByNome("PROFESSOR")
						.orElseThrow(() -> new RuntimeException("Role PROFESSOR não encontrada"));

				Professor adminUser = new Professor();
				adminUser.setNome("Administrador");
				adminUser.setEmail(adminEmail);
				adminUser.setSenha(passwordEncoder.encode("admin123"));
				adminUser.setTipoUsuario("ADMIN");
				adminUser.setDataCadastro(LocalDateTime.now());

				// ▼▼▼ CORREÇÃO AQUI ▼▼▼
				// Associa AMBAS as roles ao usuário Admin
				adminUser.setRoles(Set.of(roleAdmin, roleProfessor));
				// ▲▲▲ FIM DA CORREÇÃO ▲▲▲

				usuarioRepository.save(adminUser);
				System.out.println("==================================================");
				System.out.println("Usuário ADMIN de teste criado: " + adminEmail);
				System.out.println("Senha: admin123");
				System.out.println("==================================================");
			}
		};
	}


}
