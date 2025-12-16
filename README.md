<div align="center">

# 🎓 Senai Community

**Conectando alunos, professores e o mercado de trabalho em um único ecossistema.**

![STATUS](http://img.shields.io/static/v1?label=STATUS&message=EM%20DESENVOLVIMENTO&color=GREEN&style=for-the-badge)
![Java](https://img.shields.io/badge/Java-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![Spring](https://img.shields.io/badge/Spring-6DB33F?style=for-the-badge&logo=spring&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-00000F?style=for-the-badge&logo=mysql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

[Funcionalidades](#-funcionalidades) • [Tecnologias](#-tecnologias) • [Instalação](#-como-rodar-o-projeto) • [API](#-documentação-da-api)

</div>

---

## 📄 Sobre o Projeto

O **Senai Community** é uma plataforma full-stack desenvolvida para revolucionar a interação acadêmica e profissional dentro do ambiente SENAI. O sistema combina elementos de **redes sociais** com ferramentas robustas de **gestão de carreira**, criando um ambiente onde alunos podem expor seus portfólios, encontrar vagas de estágio e colaborar em tempo real com professores e empresas.

---

## 🚀 Funcionalidades

O sistema é modular e abrange diversas áreas de interação, garantindo uma experiência completa para o usuário.

### 💬 Social & Comunicação (Real-Time)
* **Chat via WebSocket (STOMP):** Mensagens privadas e em grupo com entrega instantânea.
* **Feed Interativo:** Postagens ricas com suporte a uploads de mídia (imagens via Cloudinary), curtidas e comentários.
* **Networking:** Sistema completo de solicitação, aceitação e listagem de amigos.
* **🛡️ Filtro de Profanidade:** Moderação automática que monitora e bloqueia conteúdo impróprio em textos e comentários.

### 🎓 Acadêmico & Projetos
* **Vitrine de Projetos:** Espaço para alunos cadastrarem projetos, detalharem stacks tecnológicas e recrutarem membros.
* **Gestão de Eventos:** Calendário acadêmico com workshops e eventos agendáveis.
* **Perfis Especializados:** Funcionalidades distintas e adaptadas para **Alunos** e **Professores**.

### 💼 Carreira & Mercado
* **Portal de Vagas:** Mural exclusivo para divulgação de oportunidades de estágio e emprego.
* **🔔 Alertas Inteligentes:** Sistema `AlertaVaga` que notifica usuários automaticamente sobre novas oportunidades compatíveis com seu perfil.

### 🔒 Segurança & Infraestrutura
* **Login Social:** Integração com **Google OAuth2**.
* **Segurança Stateless:** Proteção total das rotas via **JWT (JSON Web Token)**.
* **Cloud Upload:** Armazenamento otimizado de imagens na nuvem.

---

## 🛠️ Tecnologias Utilizadas

### Back-end (Java 21 + Spring Boot 3.4.5)
-   **Spring Web:** API RESTful robusta.
-   **Spring Security + OAuth2:** Autenticação moderna e segura.
-   **Spring Data JPA:** Persistência de dados eficiente.
-   **Spring WebSocket:** Comunicação bidirecional em tempo real.
-   **Bean Validation:** Garantia de integridade dos dados.
-   **OpenAPI (Swagger UI):** Documentação viva da API.
-   **Lombok:** Código limpo e menos verboso.

### Infraestrutura & Dados
-   **MySQL:** Banco de dados relacional.
-   **Docker:** Containerização para padronização de ambiente.
-   **Maven:** Gerenciamento de dependências.

### Front-end
-   **HTML5 / CSS3 / JavaScript (Vanilla):** Interface leve, desacoplada e responsiva, focada em performance.

---

## 💻 Como Rodar o Projeto

### Pré-requisitos
Antes de começar, você precisará ter instalado em sua máquina:
* [Java JDK 21](https://www.oracle.com/java/technologies/downloads/#java21)
* [Maven](https://maven.apache.org/)
* [MySQL Server](https://dev.mysql.com/downloads/installer/)
* [Docker](https://www.docker.com/) (Opcional, mas recomendado)

### 1. Clonar o Repositório
```bash
git clone [https://github.com/seu-usuario/SenaiCommunity.git](https://github.com/seu-usuario/SenaiCommunity.git)
cd SenaiCommunity


### 2. Configurar Variáveis de Ambiente
Por segurança, o projeto não contém credenciais no código. Crie um arquivo `.env` na raiz ou configure as variáveis no seu sistema operacional baseando-se na tabela abaixo:

| Variável | Descrição | Exemplo |
| :--- | :--- | :--- |
| `MYSQLHOST` | Endereço do Banco | `localhost` |
| `MYSQLPORT` | Porta do Banco | `3306` |
| `MYSQLDATABASE` | Nome do Schema | `senaicommunity_db` |
| `MYSQLUSER` | Usuário do Banco | `root` |
| `MYSQLPASSWORD` | Senha do Banco | `sua_senha` |
| `JWT_SECRET` | Chave de assinatura JWT | `uma_chave_super_secreta_256bit` |
| `CLOUDINARY_CLOUD_NAME` | Cloud Name | `minha_nuvem` |
| `CLOUDINARY_API_KEY` | API Key | `123456789` |
| `CLOUDINARY_API_SECRET` | API Secret | `abc-123-xyz` |
| `GOOGLE_CLIENT_ID` | Client ID (Google) | `....apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Client Secret (Google) | `GOCSPX-....` |
| `PORT` | Porta da Aplicação | `8080` |

### 3. Executando o Back-end

#### Opção A: Via Docker (Recomendado 🐳)
```bash
cd BackEnd

# Construir a imagem
docker build -t senaicommunity-backend .

# Rodar o container (com variáveis de ambiente)
docker run -p 8080:8080 --env-file .env senaicommunity-backend

---

## 📖 Documentação da API

Com o Back-end rodando, você pode acessar a documentação interativa (Swagger UI). Lá você consegue visualizar todos os endpoints, modelos de dados (schemas) e testar as requisições em tempo real.

🔗 **Acesse:** [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)

---

## 🤝 Contribuição

Contribuições são o que fazem a comunidade open source um lugar incrível para aprender, inspirar e criar. Qualquer contribuição que você fizer será **muito apreciada**.

1.  Faça um **Fork** do projeto
2.  Crie uma para sua Feature (`git checkout -b feature/minha-feature`)
3.  Faça o Commit das suas mudanças (`git commit -m 'Adiciona nova feature'`)
4.  Faça o Push para a Branch (`git push origin feature/minha-feature`)
5.  Abra um **Pull Request**

---

## 📄 Licença

Este projeto está sob a licença MIT. Consulte o arquivo [LICENSE](LICENSE) para mais informações.

<div align="center">
  <br>
  <sub>Desenvolvido por <a href="https://github.com/seu-usuario">Seu Nome</a></sub>
</div>
