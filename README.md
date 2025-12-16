🎓 Senai Community
<div align="center"><h3>Conectando alunos, professores e o mercado de trabalho em um único ecossistema</h3>
https://img.shields.io/badge/STATUS-EM%2520DESENVOLVIMENTO-green?style=for-the-badge
https://img.shields.io/badge/Java-21-orange?style=for-the-badge&logo=openjdk&logoColor=white
https://img.shields.io/badge/Spring_Boot-3.4.5-brightgreen?style=for-the-badge&logo=spring&logoColor=white
https://img.shields.io/badge/MySQL-8.0-blue?style=for-the-badge&logo=mysql&logoColor=white
https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white


https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge
https://img.shields.io/github/repo-size/seu-usuario/SenaiCommunity?style=for-the-badge
https://img.shields.io/github/issues/seu-usuario/SenaiCommunity?style=for-the-badge
https://img.shields.io/github/forks/seu-usuario/SenaiCommunity?style=for-the-badge
https://img.shields.io/github/stars/seu-usuario/SenaiCommunity?style=for-the-badge

</div>
📋 Índice
✨ Sobre o Projeto

🚀 Funcionalidades

🛠️ Arquitetura e Tecnologias

📁 Estrutura do Projeto

⚙️ Instalação e Configuração

📚 Documentação da API

🔄 CI/CD

🤝 Contribuindo

📄 Licença

👥 Time

✨ Sobre o Projeto
<div align="center">
https://via.placeholder.com/800x400/2a4365/ffffff?text=Senai+Community+Platform

</div>
O Senai Community é uma plataforma inovadora que integra o ecossistema educacional e profissional do SENAI em uma única solução digital. Desenvolvida com tecnologias modernas, nossa plataforma promove a colaboração, networking e desenvolvimento de carreira.

🎯 Objetivos Principais
🔗 Conectar alunos, professores e empresas

🚀 Acelerar a entrada no mercado de trabalho

💡 Incentivar projetos colaborativos

📈 Acompanhar o desenvolvimento profissional

👥 Público-Alvo
Perfil	Benefícios
🎓 Alunos	Portfólio digital, networking, vagas, mentorias
👨‍🏫 Professores	Acompanhamento de alunos, eventos, projetos
🏢 Empresas	Recrutamento, divulgação, parcerias
🚀 Funcionalidades
💬 Comunicação & Social
<div align="center">
Funcionalidade	Status	Descrição
Chat em Tempo Real	✅ Implementado	WebSocket com STOMP para mensagens instantâneas
Feed de Atividades	✅ Implementado	Postagens com imagens, curtidas e comentários
Sistema de Amizades	✅ Implementado	Conexões profissionais e acadêmicas
Filtro de Conteúdo	✅ Implementado	Moderação automática de profanidades
</div>
🎓 Acadêmico
<div align="center">
Módulo	Recursos	Benefícios
Projetos	Vitrine, colaboração, busca	Visibilidade e formação de times
Eventos	Calendário, inscrições, certificados	Networking e aprendizado
Perfis	Aluno, Professor, Empresa	Experiência personalizada
</div>
💼 Carreira
🔍 Portal de Vagas - Filtro inteligente por stack e experiência

📊 Dashboard Pessoal - Acompanhamento de métricas

🔔 Sistema de Notificações - Alertas personalizados

📈 Recomendações - Vagas baseadas no perfil

🔒 Segurança
yaml
Autenticação:
  - JWT Tokens (Stateless)
  - OAuth2 com Google
  - Refresh Tokens
  - Rate Limiting
  
Armazenamento:
  - Upload seguro Cloudinary
  - Criptografia de dados sensíveis
  - Backup automático
🛠️ Arquitetura e Tecnologias
📐 Arquitetura do Sistema







🏗️ Stack Tecnológica
Backend
<div align="center">
Tecnologia	Versão	Uso
https://img.shields.io/badge/Java-ED8B00?style=flat&logo=openjdk&logoColor=white	21	Linguagem Principal
https://img.shields.io/badge/Spring_Boot-6DB33F?style=flat&logo=spring-boot&logoColor=white	3.4.5	Framework Core
https://img.shields.io/badge/Spring_Security-6DB33F?style=flat&logo=spring-security&logoColor=white	6.x	Autenticação & Autorização
https://img.shields.io/badge/Spring_Data_JPA-6DB33F?style=flat&logo=spring&logoColor=white	3.x	Persistência de Dados
https://img.shields.io/badge/WebSocket-010101?style=flat&logo=socket.io&logoColor=white	STOMP	Comunicação em Tempo Real
</div>
Banco de Dados & Infra
<div align="center">
Serviço	Descrição	Status
https://img.shields.io/badge/MySQL-00000F?style=flat&logo=mysql&logoColor=white	Banco de Dados Principal	✅ Produção
https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white	Containerização	✅ Implementado
https://img.shields.io/badge/Cloudinary-3448C5?style=flat&logo=cloudinary&logoColor=white	Armazenamento de Imagens	✅ Integrado
</div>
Frontend
<div align="center">
Tecnologia	Status	Descrição
https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white	✅ Implementado	Estrutura das páginas
https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white	✅ Implementado	Estilização responsiva
https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black	✅ Implementado	Interatividade e consumo de API
</div>
📁 Estrutura do Projeto
text
SenaiCommunity/
├── 📁 BackEnd/
│   ├── 📁 src/
│   │   ├── 📁 main/
│   │   │   ├── 📁 java/com/senaicommunity/
│   │   │   │   ├── 📁 config/           # Configurações do Spring
│   │   │   │   ├── 📁 controller/       # Controladores REST
│   │   │   │   ├── 📁 model/           # Entidades JPA
│   │   │   │   ├── 📁 repository/      # Interfaces JPA
│   │   │   │   ├── 📁 service/         # Lógica de negócio
│   │   │   │   ├── 📁 security/        # Configurações de segurança
│   │   │   │   └── 📁 websocket/       # Configurações WebSocket
│   │   │   └── 📁 resources/
│   │   │       ├── application.yml     # Configurações principais
│   │   │       └── 📁 static/          # Arquivos estáticos
│   │   └── 📁 test/                    # Testes automatizados
│   ├── Dockerfile                      # Configuração do container
│   ├── docker-compose.yml             # Orquestração de serviços
│   └── pom.xml                        # Dependências Maven
├── 📁 FrontEnd/
│   ├── 📁 css/                        # Estilos
│   ├── 📁 js/                         # Scripts JavaScript
│   ├── 📁 assets/                     # Imagens e recursos
│   └── index.html                     # Página principal
├── .env.example                       # Template de variáveis
├── .gitignore                        # Arquivos ignorados pelo Git
├── LICENSE                           # Licença MIT
└── README.md                         # Esta documentação
⚙️ Instalação e Configuração
🚀 Início Rápido
1. Clonar o Repositório
bash
git clone https://github.com/seu-usuario/SenaiCommunity.git
cd SenaiCommunity
2. Configurar Ambiente
Crie um arquivo .env na raiz:

bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
3. Executar com Docker (Recomendado)
bash
cd BackEnd
docker-compose up --build
⚡ Configuração Manual
<details> <summary><b>📋 Requisitos do Sistema</b></summary>
Componente	Versão	Link
Java JDK	21+	Download
Maven	3.8+	Instalação
MySQL	8.0+	Download
Git	2.30+	Download
</details>
🔧 Passo a Passo
Configurar Banco de Dados

sql
CREATE DATABASE senaicommunity_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'senai_user'@'localhost' IDENTIFIED BY 'sua_senha_segura';
GRANT ALL PRIVILEGES ON senaicommunity_db.* TO 'senai_user'@'localhost';
FLUSH PRIVILEGES;
Configurar Variáveis de Ambiente

bash
# Backend/.env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=senaicommunity_db
DB_USER=senai_user
DB_PASSWORD=sua_senha_segura
JWT_SECRET=sua_chave_jwt_super_secreta_32_caracteres
CLOUDINARY_URL=cloudinary://key:secret@cloud_name
GOOGLE_CLIENT_ID=seu_client_id
GOOGLE_CLIENT_SECRET=seu_client_secret
SERVER_PORT=8080
Build e Execução

bash
# Na pasta BackEnd
mvn clean install
mvn spring-boot:run

# Ou executar o JAR
java -jar target/senaicommunity-1.0.0.jar
🐳 Docker Compose
yaml
# docker-compose.yml
version: '3.8'
services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: senaicommunity_db
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

  backend:
    build: .
    ports:
      - "8080:8080"
    environment:
      - DB_HOST=mysql
      - DB_PORT=3306
      - DB_NAME=senaicommunity_db
      - DB_USER=root
      - DB_PASSWORD=root_password
    depends_on:
      - mysql

volumes:
  mysql_data:
📚 Documentação da API
🔍 Endpoints Principais
Autenticação
http
POST /api/auth/login
Content-Type: application/json

{
  "email": "usuario@email.com",
  "password": "senha123"
}
Usuários
http
GET /api/users/profile
Authorization: Bearer {token}

PUT /api/users/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Novo Nome",
  "bio": "Nova biografia"
}
Postagens
http
POST /api/posts
Authorization: Bearer {token}
Content-Type: multipart/form-data

{
  "content": "Texto da postagem",
  "image": [file]
}
📖 Acessar Documentação Completa
Com a aplicação rodando:

📘 Swagger UI: http://localhost:8080/swagger-ui.html

📗 OpenAPI JSON: http://localhost:8080/v3/api-docs

<div align="center">
https://via.placeholder.com/600x300/2a4365/ffffff?text=Swagger+Documentation+Interface

</div>
📊 Modelos de Dados
json
{
  "user": {
    "id": "uuid",
    "name": "string",
    "email": "string",
    "role": "STUDENT|TEACHER|COMPANY",
    "createdAt": "timestamp"
  },
  "post": {
    "id": "uuid",
    "content": "string",
    "imageUrl": "string",
    "author": "User",
    "likes": "number",
    "comments": "Comment[]"
  }
}
🔄 CI/CD
🏗️ Pipeline de Desenvolvimento
yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up JDK 21
        uses: actions/setup-java@v3
        with:
          java-version: '21'
      - name: Run tests
        run: mvn test

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker image
        run: docker build -t senaicommunity:${{ github.sha }} .

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to production
        run: |
          echo "Deploying version ${{ github.sha }}"
📈 Badges de Status
<div align="center">
https://github.com/seu-usuario/SenaiCommunity/actions/workflows/tests.yml/badge.svg
https://github.com/seu-usuario/SenaiCommunity/actions/workflows/codeql.yml/badge.svg
https://img.shields.io/docker/cloud/build/seu-usuario/senaicommunity?style=flat
https://img.shields.io/codecov/c/github/seu-usuario/SenaiCommunity?style=flat

</div>
🤝 Contribuindo
🎯 Primeira Contribuição
Fork o projeto

Clone seu fork:

bash
git clone https://github.com/seu-usuario/SenaiCommunity.git
cd SenaiCommunity
Crie uma branch:

bash
git checkout -b feature/nova-funcionalidade
Faça suas alterações e commit:

bash
git commit -m "feat: adiciona nova funcionalidade"
Push para sua branch:

bash
git push origin feature/nova-funcionalidade
Abra um Pull Request

📝 Padrões de Commit
bash
feat:     Nova funcionalidade
fix:      Correção de bug
docs:     Documentação
style:    Formatação, ponto e vírgula, etc
refactor: Refatoração de código
test:     Adiciona testes
chore:    Tarefas de build, configurações
🔍 Code Review
✅ Todos os testes passando

✅ Documentação atualizada

✅ Código segue o style guide

✅ Não introduz breaking changes

📄 Licença
Este projeto está licenciado sob a MIT License - veja o arquivo LICENSE para detalhes.

📋 Resumo da Licença
text
MIT License

Permissões:
- Uso comercial
- Modificação
- Distribuição
- Uso privado

Condições:
- Incluir aviso de copyright e permissão

Limitações:
- Não há garantia
- Não há responsabilidade
👥 Time
<div align="center">
🏆 Desenvolvedores
Nome	Função	Contato
Seu Nome	Desenvolvedor Full Stack	GitHub
🙏 Agradecimentos
SENAI - Pela oportunidade e suporte

Professores - Pela orientação técnica

Comunidade - Pelo feedback e testes

🌟 Considerou útil este projeto?
Dê uma ⭐ no repositório!

</div>
<div align="center">
📞 Entre em Contato • 📧 Email • 🐦 Twitter • 💼 LinkedIn

Desenvolvido com ❤️ para a comunidade SENAI

</div>
