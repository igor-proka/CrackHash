FROM eclipse-temurin:11-jdk-alpine AS builder

WORKDIR /app
COPY gradlew .
COPY gradle gradle
COPY build.gradle .
COPY settings.gradle .

# Даем wrapper права на запуск внутри Linux-контейнера.
RUN sed -i 's/\r$//' ./gradlew && chmod +x ./gradlew
# Заранее скачиваем зависимости, чтобы Docker лучше кешировал сборку.
RUN ./gradlew dependencies --no-daemon

COPY src src
RUN ./gradlew build -x test --no-daemon

FROM eclipse-temurin:11-jre-alpine

WORKDIR /app
COPY --from=builder /app/build/libs/*.jar app.jar

EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
