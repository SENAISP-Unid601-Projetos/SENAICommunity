# 🎓 Senai Community

<div align="center">

![Badge Concluído](http://img.shields.io/static/v1?label=STATUS&message=CONCLUÍDO&color=BLUE&style=for-the-badge)
<br><br>

<img src="https://img.shields.io/badge/java-%23ED8B00.svg?style=for-the-badge&logo=openjdk&logoColor=white" alt="Java" />
<img src="https://img.shields.io/badge/spring-%236DB33F.svg?style=for-the-badge&logo=spring&logoColor=white" alt="Spring" />
<img src="https://img.shields.io/badge/mysql-%2300f.svg?style=for-the-badge&logo=mysql&logoColor=white" alt="MySQL" />
<img src="https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
<img src="https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E" alt="JavaScript" />
<br>
<img src="https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5" />
<img src="https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3" />
<img src="https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white" alt="Cloudinary" />
<img src="https://img.shields.io/badge/Swagger-85EA2D?style=for-the-badge&logo=Swagger&logoColor=white" alt="Swagger" />

<br>

<h3>Conectando alunos, professores e o mercado de trabalho em um único ecossistema.</h3>

[Sobre](#-sobre-o-projeto) •
[Funcionalidades](#-funcionalidades) •
[Tecnologias](#-tecnologias) •
[Instalação](#-como-rodar-o-projeto) •
[API](#-documentação-da-api) •
[Equipe](#-desenvolvedores)

</div>

--- 

## 👾 Acesse na Web : https://senai-community-deploy2.vercel.app
**Obs:** O servidor onde o projeto esta hospedado, fica em Stand by quando esta ocioso por muito tempo, assim pode ter um atraso nas primeiras consultas ao servidor no dia.

---

## 📄 Sobre o Projeto

O **Senai Community** é uma plataforma full-stack desenvolvida para revolucionar a interação acadêmica e profissional dentro do ambiente SENAI. O sistema combina a dinâmica de redes sociais com ferramentas robustas de gestão de carreira e projetos, criando um ambiente fértil onde alunos podem expor seus portfólios, encontrar vagas de estágio e colaborar em tempo real com professores e colegas.

---

## 🚀 Funcionalidades

O sistema é modular, escalável e abrange diversas áreas de interação:

### 💬 Social & Comunicação (Real-Time)
* **Chat em Tempo Real:** Mensagem instantânea (privada e grupos) via **WebSocket (STOMP)**.
* **Feed Interativo:** Postagens ricas com suporte a mídia, curtidas e comentários.
* **Networking:** Sistema completo de solicitação e aceitação de amizades.
* **Moderação Automática:** Filtro de palavrão integrado para bloquear conteúdo impróprio.

### 🎓 Acadêmico & Projetos
* **Vitrine de Projetos:** Portfólio digital para alunos detalharem tecnologias e buscarem equipes.
* **Gestão de Eventos:** Calendário interativo de workshops e eventos acadêmicos.
* **Perfis Personalizados:** Experiência adaptada para **Alunos** e **Professores**.

### 💼 Carreira & Mercado
* **Portal de Vagas:** Mural exclusivo para estágios e empregos.
* **AlertaVaga:** Sistema inteligente de notificações para oportunidades compatíveis.

### 🔒 Segurança & Integrações
* **Login Social:** Autenticação via **Google OAuth2**.
* **JWT (Stateless):** Segurança robusta nas rotas da API.
* **Cloudinary:** Armazenamento otimizado de mídias na nuvem.

---

## 🛠️ Tecnologias

Abaixo, a stack completa utilizada no desenvolvimento do **Senai Community**:

### Back-end (Java Ecosystem)
| Tecnologia | Função |
| :--- | :--- |
| **Java 21** | Linguagem base moderna e performática. |
| **Spring Boot 3.4.5** | Framework principal. |
| **Spring Security + OAuth2** | Gestão de autenticação e acesso. |
| **Spring WebSocket** | Comunicação bidirecional para o Chat. |
| **Spring Data JPA** | Camada de persistência. |
| **Lombok** | Produtividade e redução de código boilerplate. |
| **OpenAPI (Swagger)** | Documentação viva da API. |

### Infraestrutura & Dados
| Tecnologia | Função |
| :--- | :--- |
| **MySQL** | Banco de dados relacional. |
| **Docker** | Containerização da aplicação. |
| **Maven** | Gerenciamento de dependências. |
| **Cloudinary** | Gestão de assets (imagens) na nuvem. |

### Front-end
* **HTML5 / CSS3**
* **JavaScript (Vanilla)**
* **Design Responsivo**

---

## 💻 Como Rodar o Projeto

### Pré-requisitos
* Java JDK 21
* Maven
* MySQL Server
* Docker (Opcional, mas recomendado)

### 1. Clonar o Repositório
```bash
git clone https://github.com/SENAISP-Unid601-Projetos/SENAICommunity
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

## 🔮 Melhorias Futuras & Roadmap

Este projeto é um organismo vivo. Abaixo detalho os próximos passos estratégicos para evoluir a arquitetura do **Senai Community**, focando em escalabilidade e experiência do desenvolvedor:

### 🛠️ Evolução Técnica (Back-end)
- [ ] **Migração de Banco de Dados:** Implementar **Flyway** ou **Liquibase** para versionamento de schema do banco (substituindo o atual `ddl-auto=update`), garantindo integridade em produção.
- [ ] **Sistema de Notificações Externas:** Adicionar a dependência `spring-boot-starter-mail` para implementar recuperação de senha e alertas de vagas via E-mail.
- [ ] **Testes de Integração:** Expandir a suíte de testes (atualmente focada em `BackEndApplicationTests`) para cobrir fluxos completos de Controller e Service utilizando **Mockito** e banco H2 em memória.
- [ ] **Monitoramento (Actuator):** Integrar o **Spring Boot Actuator** + **Prometheus** para expor métricas de saúde da API e consumo de memória.

### 🎨 Modernização do Front-end
- [ ] **Adoção de Framework Reativo:** Refatorar a estrutura atual de HTML/JS Vanilla (`FrontEnd/Vaga/JS`, `FrontEnd/Projeto/JS`, etc.) para **React.js** ou **Vue.js**, criando componentes reutilizáveis.
- [ ] **Build Tooling:** Implementar **Vite** ou **Webpack** para otimizar e minificar os assets (CSS/JS) que hoje são servidos estaticamente.
- [ ] **Acessibilidade Aprimorada:** Revisar o HTML para incluir atributos ARIA e garantir navegação sem mouse (WCAG 2.1).

### ☁️ DevOps & Infraestrutura
- [ ] **Orquestração de Containers:** Criar um arquivo `docker-compose.yml` para subir a aplicação + MySQL + Redis (para cache) com um único comando.
- [ ] **Pipeline CI/CD:** Configurar workflows do **GitHub Actions** para buildar o projeto Java e rodar os testes automaticamente a cada Push.

### 🚀 Novas Funcionalidades de Negócio
- [ ] **Gerador de Currículos PDF:** Implementar biblioteca (como *iText* ou *OpenPDF*) para que alunos exportem seus perfis como currículos formatados.
- [ ] **Chamadas de Vídeo:** Evoluir o Chat WebSocket atual para suportar WebRTC, permitindo entrevistas simuladas na plataforma.
- [ ] **Recomendação Inteligente:** Criar algoritmo para cruzar as `skills` do Aluno com os requisitos da `Vaga`, ordenando as oportunidades por compatibilidade.

---

## 🤝 Contribuição

Contribuições são o que fazem a comunidade open source um ótimo lugar para aprender, inspirar e criar. Qualquer contribuição que você fizer será **Bem-vinda!**

1.  Faça um **Fork** do projeto
2.  Crie uma para sua Feature (`git checkout -b feature/minha-feature`)
3.  Faça o Commit das suas mudanças (`git commit -m 'Adiciona nova feature'`)
4.  Faça o Push para a Branch (`git push origin feature/minha-feature`)
5.  Abra um **Pull Request**

---

## 👥 Desenvolvedores

<table border="0">
  <tr>
    <td align="center">
      <a href="https://github.com/GabrielPiscke">
        <img src="https://avatars.githubusercontent.com/u/185540777?v=4" width="100px;" style="border-radius: 50%;" alt="Gabriel Piscke"/>
      </a>
      <br>
      <sub>
        <b>Gabriel Piscke</b>
      </sub>
    </td>
    <td align="center">
      <a href="https://github.com/YuriSantxz07">
        <img src="https://avatars.githubusercontent.com/u/185539590?v=4" width="100px;" style="border-radius: 50%;" alt="Yuri Santos"/>
      </a>
      <br>
      <sub>
        <b>Yuri Santos</b>
      </sub>
    </td>
    <td align="center">
      <a href="https://github.com/ViniciusDev00">
        <img src="https://avatars.githubusercontent.com/u/185539340?v=4" width="100px;" style="border-radius: 50%;" alt="Vinicius Biancolini"/>
      </a>
      <br>
      <sub>
        <b>Vinicius Biancolini</b>
      </sub>
    </td>
    <td align="center">
      <a href="https://github.com/Matheusslb">
        <img src="https://avatars.githubusercontent.com/u/185539094?v=4" width="100px;" style="border-radius: 50%;" alt="Matheus Brito"/>
      </a>
      <br>
      <sub>
        <b>Matheus Brito</b>
      </sub>
    </td>
    <td align="center">
      <a href="https://github.com/MiguelGallo1227">
        <img src="https://avatars.githubusercontent.com/u/186326783?v=4" width="100px;" style="border-radius: 50%;" alt="Miguel Gallo"/>
      </a>
      <br>
      <sub>
        <b>Miguel Gallo</b>
      </sub>
    </td>
  </tr>
</table>



