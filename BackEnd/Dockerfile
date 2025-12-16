# --- Estágio 1: Compilação (Builder) ---
FROM eclipse-temurin:21-jdk-jammy AS builder

WORKDIR /app

# Instala dos2unix para corrigir arquivos vindos do Windows
RUN apt-get update && apt-get install -y dos2unix

# Copia configurações do Maven primeiro (para cachear dependências)
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./

# Corrige permissões e quebras de linha do Windows
RUN dos2unix mvnw && chmod +x mvnw

# Baixa dependências (se o pom.xml não mudou, o Docker usa o cache aqui)
# Adicionamos flags para reduzir uso de memória
RUN ./mvnw dependency:go-offline -B

# Copia o código fonte
COPY src ./src

# Compila o projeto sem rodar testes (economiza tempo e RAM)
# Limitamos a memória do Maven para não estourar o plano do Railway
RUN export MAVEN_OPTS="-Xmx512m" && ./mvnw clean package -DskipTests

# --- Estágio 2: Execução (Runtime) ---
FROM eclipse-temurin:21-jre-jammy

WORKDIR /app

# Copia apenas o JAR gerado (deixa o lixo do Maven para trás)
COPY --from=builder /app/target/*.jar app.jar

# Expõe a porta padrão
EXPOSE 8080

# Roda a aplicacao
# Ajuste para container de 512MB (Deixa ~150MB para o OS e Overhead e ~350MB para a Heap)
CMD ["java", "-Xms256m", "-Xmx350m", "-jar", "app.jar"]