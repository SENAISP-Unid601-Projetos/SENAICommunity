// BackEnd/src/main/java/com/SenaiCommunity/BackEnd/BackEndApplication.java (CONTEÚDO COMPLETO E ATUALIZADO)

package com.SenaiCommunity.BackEnd;

import com.SenaiCommunity.BackEnd.Entity.Professor;
import com.SenaiCommunity.BackEnd.Entity.Role;
import com.SenaiCommunity.BackEnd.Entity.Usuario;
import com.SenaiCommunity.BackEnd.Entity.Vaga;
import com.SenaiCommunity.BackEnd.Entity.Evento; // 1. Importar a entidade Evento
import com.SenaiCommunity.BackEnd.Enum.*; // Importar todos os Enums
import com.SenaiCommunity.BackEnd.Repository.EventoRepository; // 2. Importar o repositório de Evento
import com.SenaiCommunity.BackEnd.Repository.RoleRepository;
import com.SenaiCommunity.BackEnd.Repository.UsuarioRepository;
import com.SenaiCommunity.BackEnd.Repository.VagaRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate; // Usar LocalDate para datas sem hora
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@SpringBootApplication
public class BackEndApplication {

	public static void main(String[] args) {
		SpringApplication.run(BackEndApplication.class, args);
	}

	@Component
	public class DataInitializer implements CommandLineRunner {

		private final RoleRepository roleRepository;
		private final VagaRepository vagaRepository;
		private final UsuarioRepository usuarioRepository;
		private final PasswordEncoder passwordEncoder;
		private final EventoRepository eventoRepository; // 3. Injetar o repositório

		public DataInitializer(RoleRepository roleRepository, VagaRepository vagaRepository, UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder, EventoRepository eventoRepository) {
			this.roleRepository = roleRepository;
			this.vagaRepository = vagaRepository;
			this.usuarioRepository = usuarioRepository;
			this.passwordEncoder = passwordEncoder;
			this.eventoRepository = eventoRepository; // 4. Atribuir no construtor
		}

		@Override
		public void run(String... args) {
			// Cria Roles básicas
			createRoleIfNotFound("ADMIN");
			createRoleIfNotFound("PROFESSOR");
			createRoleIfNotFound("ALUNO");

			// Cria um usuário Professor para ser o autor
			Usuario autor = createProfessorUserIfNotFound();

			// --- Cria Vagas de exemplo ---
			createVagaIfNotFound(
					"Desenvolvedor Front-End Pleno",
					"Estamos expandindo nosso time e buscamos um desenvolvedor Front-End com experiência para criar interfaces incríveis e responsivas para nossos clientes.",
					"Tech Solutions Inc.",
					LocalizacaoVaga.HIBRIDO,
					NivelVaga.PLENO,
					TipoContratacao.TEMPO_INTEGRAL,
					autor
			);

			createVagaIfNotFound(
					"Estágio em Análise de Dados",
					"Oportunidade para estudantes que desejam iniciar a carreira em dados, aprendendo e aplicando técnicas de análise e visualização em projetos reais.",
					"Inova Dev",
					LocalizacaoVaga.REMOTO,
					NivelVaga.JUNIOR,
					TipoContratacao.ESTAGIO,
					autor
			);

			createVagaIfNotFound(
					"Engenheiro de Software Backend Sênior",
					"Procuramos um engenheiro experiente para liderar o desenvolvimento de microserviços escaláveis em nossa plataforma de nuvem.",
					"Code Masters",
					LocalizacaoVaga.PRESENCIAL,
					NivelVaga.SENIOR,
					TipoContratacao.TEMPO_INTEGRAL,
					autor
			);

			// --- ✅ Cria Eventos de exemplo ---
			createEventoIfNotFound(
					"Hackathon de Inovação SENAI",
					"Participe de 48 horas de desenvolvimento de soluções inovadoras para a indústria 4.0. Haverá mentoria com especialistas e prêmios para as melhores equipes.",
					LocalDate.now().plusDays(20), // Data futura
					"Auditório Principal - SENAI",
					FormatoEvento.PRESENCIAL,
					CategoriaEvento.COMPETICAO
			);

			createEventoIfNotFound(
					"Workshop de React Avançado",
					"Aprenda sobre hooks, gerenciamento de estado com Redux Toolkit e boas práticas em um workshop online e interativo.",
					LocalDate.now().plusDays(45), // Data futura
					"Online via Teams",
					FormatoEvento.ONLINE,
					CategoriaEvento.TECNOLOGIA
			);

			createEventoIfNotFound(
					"Feira de Carreiras Tech",
					"Conecte-se com recrutadores das maiores empresas de tecnologia, participe de palestras e prepare seu currículo.",
					LocalDate.now().minusDays(10), // Data passada
					"Pátio de Eventos",
					FormatoEvento.HIBRIDO,
					CategoriaEvento.CARREIRA
			);
		}

		private void createRoleIfNotFound(String roleName) {
			if (!roleRepository.existsByNome(roleName)) {
				Role role = new Role();
				role.setNome(roleName);
				roleRepository.save(role);
				System.out.println("Role criada: " + roleName);
			}
		}

		private Usuario createProfessorUserIfNotFound() {
			Optional<Usuario> userOpt = usuarioRepository.findByEmail("professor@senaicommunity.com");
			if (userOpt.isEmpty()) {
				Professor prof = new Professor();
				prof.setNome("Professor Admin");
				prof.setEmail("professor@senaicommunity.com");
				prof.setSenha(passwordEncoder.encode("admin123"));
				prof.setTipoUsuario("PROFESSOR");

				Role roleProfessor = roleRepository.findByNome("PROFESSOR")
						.orElseThrow(() -> new RuntimeException("Role PROFESSOR não encontrada"));
				prof.setRoles(Set.of(roleProfessor));
				System.out.println("Usuário Professor criado.");
				return usuarioRepository.save(prof);
			}
			return userOpt.get();
		}

		private void createVagaIfNotFound(String titulo, String desc, String empresa, LocalizacaoVaga local, NivelVaga nivel, TipoContratacao tipo, Usuario autor) {
			if (vagaRepository.findAll().stream().noneMatch(v -> v.getTitulo().equals(titulo))) {
				Vaga vaga = new Vaga();
				vaga.setTitulo(titulo);
				vaga.setDescricao(desc);
				vaga.setEmpresa(empresa);
				vaga.setLocalizacao(local);
				vaga.setNivel(nivel);
				vaga.setTipoContratacao(tipo);
				vaga.setDataPublicacao(LocalDateTime.now());
				vaga.setAutor(autor);
				vagaRepository.save(vaga);
				System.out.println("Vaga de exemplo criada: " + titulo);
			}
		}

		// ✅ 5. Nova função para criar eventos
		private void createEventoIfNotFound(String nome, String descricao, LocalDate data, String local, FormatoEvento formato, CategoriaEvento categoria) {
			if (eventoRepository.findAll().stream().noneMatch(e -> e.getNome().equals(nome))) {
				Evento evento = new Evento();
				evento.setNome(nome);
				evento.setDescricao(descricao);
				evento.setData(data);
				evento.setLocal(local);
				evento.setFormato(formato);
				evento.setCategoria(categoria);
				eventoRepository.save(evento);
				System.out.println("Evento de exemplo criado: " + nome);
			}
		}
	}
}