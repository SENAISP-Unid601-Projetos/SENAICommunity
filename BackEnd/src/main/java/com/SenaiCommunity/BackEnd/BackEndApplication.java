package com.SenaiCommunity.BackEnd;

import com.SenaiCommunity.BackEnd.Entity.Evento;
import com.SenaiCommunity.BackEnd.Entity.Role;
import com.SenaiCommunity.BackEnd.Entity.Vaga; // IMPORTAR
import com.SenaiCommunity.BackEnd.Enum.CategoriaEvento;
import com.SenaiCommunity.BackEnd.Enum.FormatoEvento;
import com.SenaiCommunity.BackEnd.Repository.EventoRepository;
import com.SenaiCommunity.BackEnd.Repository.RoleRepository;
import com.SenaiCommunity.BackEnd.Repository.VagaRepository; // IMPORTAR
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List; // IMPORTAR

@SpringBootApplication
public class BackEndApplication {

	public static void main(String[] args) {
		SpringApplication.run(BackEndApplication.class, args);
	}

	@Component
	public class DataInitializer implements CommandLineRunner {

		private final RoleRepository roleRepository;
		private final EventoRepository eventoRepository;
		private final VagaRepository vagaRepository; // ADICIONAR

		public DataInitializer(RoleRepository roleRepository, EventoRepository eventoRepository, VagaRepository vagaRepository) { // MODIFICAR
			this.roleRepository = roleRepository;
			this.eventoRepository = eventoRepository;
			this.vagaRepository = vagaRepository; // ADICIONAR
		}

		@Override
		public void run(String... args) {
			createRoleIfNotFound("ADMIN");
			createRoleIfNotFound("PROFESSOR");
			createRoleIfNotFound("ALUNO");

			// --- EVENTOS DE EXEMPLO ---
			createEventIfNotFound(
					"Hackathon de Soluções Industriais 4.0",
					LocalDate.of(2025, 10, 25),
					"SENAI São Carlos",
					FormatoEvento.PRESENCIAL,
					CategoriaEvento.COMPETICAO,
					"evento1.jpg"
			);
			// ... (outros eventos)

			// --- VAGAS DE EXEMPLO (NOVO BLOCO) ---
			createVagaIfNotFound(
					"Desenvolvedor Front-End Pleno", "Tech Solutions Inc.", "https://placehold.co/100x100/58a6ff/ffffff?text=TS",
					"Híbrido", "São Paulo, SP", "Pleno", "Tempo Integral",
					"Estamos expandindo nosso time e buscamos um desenvolvedor Front-End com experiência para criar interfaces incríveis e responsivas para nossos clientes.",
					LocalDate.now().minusDays(1), List.of("React", "TypeScript", "Next.js")
			);
			createVagaIfNotFound(
					"Estágio em Análise de Dados", "Inova Dev", "https://placehold.co/100x100/f78166/ffffff?text=ID",
					"Remoto", "Brasil", "Júnior", "Estágio",
					"Oportunidade para estudantes que desejam iniciar a carreira em dados, aprendendo e aplicando técnicas de análise e visualização em projetos reais.",
					LocalDate.now().minusDays(3), List.of("Python", "SQL", "Power BI")
			);
			createVagaIfNotFound(
					"Engenheiro de Software Backend Sênior", "Code Masters", "https://placehold.co/100x100/3fb950/ffffff?text=CM",
					"Presencial", "Campinas, SP", "Sênior", "Tempo Integral",
					"Procuramos um engenheiro experiente para liderar o desenvolvimento de microserviços escaláveis em nossa plataforma de nuvem.",
					LocalDate.now().minusDays(5), List.of("Java", "Spring Boot", "AWS")
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

		private void createEventIfNotFound(String nome, LocalDate data, String local, FormatoEvento formato, CategoriaEvento categoria, String imagemCapaUrl) {
			if (eventoRepository.findAll( (root, query, cb) -> cb.equal(root.get("nome"), nome) ).isEmpty()) {
				Evento evento = new Evento();
				evento.setNome(nome);
				evento.setData(data);
				evento.setLocal(local);
				evento.setFormato(formato);
				evento.setCategoria(categoria);
				evento.setImagemCapa(imagemCapaUrl);
				eventoRepository.save(evento);
				System.out.println("Evento criado: " + nome);
			}
		}

		// --- NOVO MÉTODO PARA CRIAR VAGAS ---
		private void createVagaIfNotFound(String titulo, String empresa, String logoUrl, String local, String cidade, String nivel, String tipo, String descricao, LocalDate dataPublicacao, List<String> tags) {
			if (vagaRepository.findAll((root, query, cb) -> cb.equal(root.get("titulo"), titulo)).isEmpty()) {
				Vaga vaga = new Vaga();
				vaga.setTitulo(titulo);
				vaga.setEmpresa(empresa);
				vaga.setLogoUrl(logoUrl);
				vaga.setLocal(local);
				vaga.setCidade(cidade);
				vaga.setNivel(nivel);
				vaga.setTipo(tipo);
				vaga.setDescricao(descricao);
				vaga.setDataPublicacao(dataPublicacao);
				vaga.setTags(tags);
				vagaRepository.save(vaga);
				System.out.println("Vaga criada: " + titulo);
			}
		}
	}
}