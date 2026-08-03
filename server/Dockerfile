FROM eclipse-temurin:25-jdk AS build

WORKDIR /build

COPY gradlew gradlew
COPY gradle gradle
RUN chmod +x gradlew && ./gradlew --version

COPY build.gradle.kts settings.gradle.kts ./
RUN ./gradlew dependencies --no-daemon || true

COPY src src
RUN ./gradlew bootJar --no-daemon -x test

FROM eclipse-temurin:25-jre

RUN groupadd --system jipkok && useradd --system --gid jipkok jipkok

WORKDIR /app

COPY --from=build /build/build/libs/*.jar app.jar

USER jipkok

EXPOSE 8080

ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
