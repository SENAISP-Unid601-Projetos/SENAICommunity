# ---- Etapa 1: O Construtor (Builder) ----
# Usa uma imagem do Maven com Java 21 para construir o projeto
FROM maven:3.9-eclipse-temurin-21 AS builder

# Define o diretório de trabalho
WORKDIR /app

# Copia os arquivos de configuração do Maven e o pom.xml
COPY .mvn/ .mvn
COPY mvnw pom.xml ./

# Baixa as dependências do projeto
RUN ./mvnw dependency:go-offline

# Copia o resto do código fonte
COPY src ./src

# Executa o comando para construir o projeto e criar o .jar
RUN ./mvnw clean package -DskipTests


# ---- Etapa 2: A Imagem Final ----
# Usa uma imagem Java leve para rodar a aplicação
FROM openjdk:21-slim

WORKDIR /app

# Copia APENAS o arquivo .jar da etapa do construtor
COPY --from=builder /app/target/BackEnd-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080

# Comando final para iniciar a aplicação
ENTRYPOINT ["java", "-jar", "app.jar"]