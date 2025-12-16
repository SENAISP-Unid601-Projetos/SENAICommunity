<div align="center">

# 🎓 Senai Community

**Conectando alunos, professores e o mercado de trabalho em um único ecossistema.**

![STATUS](https://img.shields.io/static/v1?label=STATUS&message=EM%20DESENVOLVIMENTO&color=GREEN&style=for-the-badge)
![Java](https://img.shields.io/badge/Java-21-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![Spring](https://img.shields.io/badge/Spring_Boot-3.4.5-6DB33F?style=for-the-badge&logo=spring&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-00000F?style=for-the-badge&logo=mysql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

[📄 Sobre](#-sobre-o-projeto) •
[🚀 Funcionalidades](#-funcionalidades) •
[🛠️ Tecnologias](#️-tecnologias-utilizadas) •
[💻 Instalação](#-como-rodar-o-projeto) •
[📖 API](#-documentação-da-api)

</div>

---

## 📄 Sobre o Projeto

O **Senai Community** é uma plataforma **full-stack** criada para fortalecer a interação acadêmica e profissional dentro do ecossistema **SENAI**.

O sistema une conceitos de **rede social**, **gestão de carreira** e **comunicação em tempo real**, permitindo que:

- Alunos divulguem projetos e portfólios  
- Professores acompanhem, orientem e divulguem eventos  
- Empresas publiquem vagas e encontrem talentos  

Tudo em um ambiente moderno, seguro e integrado.

---

## 🚀 Funcionalidades

O sistema é modular, escalável e orientado à experiência do usuário.

### 💬 Social & Comunicação (Tempo Real)
- **Chat via WebSocket (STOMP)** — mensagens privadas e em grupo
- **Feed Interativo** — postagens com imagens (Cloudinary), curtidas e comentários
- **Sistema de Amizades** — solicitações, aceitação e listagem
- **🛡️ Filtro de Profanidade** — moderação automática de textos e comentários

### 🎓 Acadêmico & Projetos
- **Vitrine de Projetos** — divulgação de projetos, stacks e recrutamento de membros
- **Gestão de Eventos** — calendário acadêmico com workshops e palestras
- **Perfis Especializados** — funcionalidades distintas para **Alunos** e **Professores**

### 💼 Carreira & Mercado
- **Portal de Vagas** — oportunidades de estágio e emprego
- **🔔 Alertas Inteligentes** — notificações automáticas com base no perfil do usuário

### 🔒 Segurança & Infraestrutura
- **Autenticação JWT (Stateless)**
- **Login Social com Google OAuth2**
- **Upload de Imagens na Nuvem (Cloudinary)**

---

## 🛠️ Tecnologias Utilizadas

### 🔙 Back-end
- **Java 21**
- **Spring Boot 3.4.5**
- Spring Web (REST API)
- Spring Security + OAuth2
- Spring Data JPA
- Spring WebSocket
- Bean Validation
- OpenAPI (Swagger)
- Lombok

### 🗄️ Infraestrutura & Dados
- **MySQL**
- **Docker**
- **Maven**

### 🎨 Front-end
- **HTML5**
- **CSS3**
- **JavaScript (Vanilla)**  
Interface leve, desacoplada e responsiva.

---

## 💻 Como Rodar o Projeto

### 🔧 Pré-requisitos
- Java JDK 21  
- Maven  
- MySQL  
- Docker (opcional, recomendado)

---

### 1️⃣ Clonar o Repositório
```bash
git clone https://github.com/seu-usuario/SenaiCommunity.git
cd SenaiCommunity
2️⃣ Configurar Variáveis de Ambiente
Crie um arquivo .env na raiz do projeto ou configure as variáveis no sistema:

Variável	Descrição	Exemplo
MYSQLHOST	Host do banco	localhost
MYSQLPORT	Porta do banco	3306
MYSQLDATABASE	Nome do schema	senaicommunity_db
MYSQLUSER	Usuário	root
MYSQLPASSWORD	Senha	sua_senha
JWT_SECRET	Chave JWT	chave_super_secreta
CLOUDINARY_CLOUD_NAME	Cloudinary	minha_nuvem
CLOUDINARY_API_KEY	API Key	123456
CLOUDINARY_API_SECRET	API Secret	abc-xyz
GOOGLE_CLIENT_ID	OAuth Client ID	*.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET	OAuth Secret	GOCSPX-...
PORT	Porta da aplicação	8080

3️⃣ Executar o Back-end
🐳 Opção A — Docker (Recomendado)
bash
Copiar código
cd BackEnd

docker build -t senaicommunity-backend .
docker run -p 8080:8080 --env-file .env senaicommunity-backend
📖 Documentação da API
Com a aplicação em execução, acesse a documentação interativa:

🔗 Swagger UI:
http://localhost:8080/swagger-ui.html

Nela você pode:

Visualizar endpoints

Ver modelos de dados

Testar requisições em tempo real

🤝 Contribuição
Contribuições são bem-vindas 💙

Faça um Fork

Crie uma branch (feature/minha-feature)

Commit suas alterações

Faça o push

Abra um Pull Request

📄 Licença
Este projeto está licenciado sob a MIT License.
Veja o arquivo LICENSE para mais detalhes.

<div align="center"> <sub>Desenvolvido por <a href="https://github.com/seu-usuario">Seu Nome</a></sub> </div> ```
