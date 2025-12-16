# 🎓 Senai Community

<div align="center">

![Badge em Desenvolvimento](http://img.shields.io/static/v1?label=STATUS&message=EM%20DESENVOLVIMENTO&color=GREEN&style=for-the-badge)
![Java](https://img.shields.io/badge/java-%23ED8B00.svg?style=for-the-badge&logo=openjdk&logoColor=white)
![Spring](https://img.shields.io/badge/spring-%236DB33F.svg?style=for-the-badge&logo=spring&logoColor=white)
![MySQL](https://img.shields.io/badge/mysql-%2300f.svg?style=for-the-badge&logo=mysql&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)

**Conectando alunos, professores e o mercado de trabalho em um único ecossistema.**

[Funcionalidades](#-funcionalidades) • [Tecnologias](#-tecnologias) • [Instalação](#-como-rodar-o-projeto) • [API](#-documentação-da-api)

</div>

---

## 📄 Sobre o Projeto

O **Senai Community** é uma plataforma full-stack desenvolvida para facilitar a interação acadêmica e profissional dentro do ambiente SENAI. O sistema combina elementos de redes sociais com ferramentas de gestão de carreira e projetos, criando um ambiente onde alunos podem expor seus portfólios, encontrar vagas de estágio e colaborar em tempo real.

---

## 🚀 Funcionalidades

O sistema é modular e abrange diversas áreas de interação:

### 💬 Social & Comunicação (Real-Time)
* **Chat em Tempo Real:** Sistema de mensagens privadas e em grupo utilizando **WebSocket (STOMP)** para comunicação instantânea.
* **Feed Interativo:** Postagens ricas com suporte a uploads de mídia (imagens), curtidas e comentários.
* **Networking:** Sistema de amizades (solicitação, aceitação e listagem de amigos).
* **Moderação Automática:** Implementação de um **Filtro de Profanidade** que monitora e bloqueia conteúdo impróprio em textos e comentários.

### 🎓 Acadêmico & Projetos
* **Vitrine de Projetos:** Alunos podem cadastrar projetos, detalhar tecnologias usadas e buscar membros para formar equipes.
* **Gestão de Eventos:** Calendário de eventos acadêmicos e workshops com agendamento.
* **Perfis Distintos:** Funcionalidades separadas e especializadas para **Alunos** e **Professores**.

### 💼 Carreira & Mercado
* **Portal de Vagas:** Mural exclusivo para divulgação de vagas de estágio e emprego.
* **Alertas Inteligentes:** Sistema de notificação (`AlertaVaga`) que avisa usuários sobre novas oportunidades compatíveis.

### 🔒 Segurança & Integrações
* **Login Social:** Integração com **Google OAuth2** para autenticação rápida e segura.
* **JWT (JSON Web Token):** Proteção stateless das rotas da API.
* **Upload na Nuvem:** Integração com **Cloudinary** para armazenamento otimizado de fotos de perfil e capas de projetos.

---

## 🛠️ Tecnologias

### Back-end (Java 21 + Spring Boot 3.4.5)
* **Spring Web:** Criação da API RESTful.
* **Spring Security + OAuth2 Client:** Autenticação e controle de acesso.
* **Spring Data JPA:** Abstração e persistência de dados.
* **Spring WebSocket:** Protocolo para comunicação bidirecional (Chat).
* **Bean Validation:** Validação de dados de entrada.
* **OpenAPI (Swagger UI):** Documentação automática da API.
* **Lombok:** Redução de verbosidade do código Java.

### Infraestrutura & Dados
* **MySQL:** Banco de dados relacional.
* **Docker:** Containerização da aplicação para fácil deploy.
* **Maven:** Gerenciamento de dependências e build.

### Front-end
* **HTML5 / CSS3 / JavaScript (Vanilla):** Interface leve, desacoplada e responsiva.

---

## 💻 Como Rodar o Projeto

### Pré-requisitos
* Java JDK 21
* Maven
* MySQL Server
* Contas de Desenvolvedor: Google Cloud (OAuth) e Cloudinary.

### 1. Clonar o Repositório
```bash
git clone [https://github.com/seu-usuario/SenaiCommunity.git](https://github.com/seu-usuario/SenaiCommunity.git)
cd SenaiCommunity
```

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
```
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
  <sub>Desenvolvido por <a href="https://github.com/GabrielPiscke">Gabriel Piscke</a>
  <a href="https://github.com/YuriSantxz07">Yuri Santos</a>
  <a href="https://github.com/ViniciusDev00">Vinicius Biancolini</a>
  <a href="https://github.com/Matheusslb">Matheus Brito</a>
  <a href="https://github.com/MiguelGallo1227">Miguel Gallo</a>
  </sub>
</div>



