FROM eclipse-temurin:25-jdk-alpine AS build

WORKDIR /build

COPY gradlew gradlew
COPY gradle gradle
RUN chmod +x gradlew && ./gradlew --version

COPY build.gradle.kts settings.gradle.kts ./
RUN ./gradlew dependencies --no-daemon || true

COPY src src
RUN ./gradlew bootJar --no-daemon -x test \
    && java -Djarmode=tools -jar build/libs/*.jar extract --layers --destination extracted

FROM eclipse-temurin:25-jre-alpine

RUN addgroup --system jipkok && adduser --system --ingroup jipkok jipkok

WORKDIR /app

COPY --from=build /build/extracted/dependencies/ ./
COPY --from=build /build/extracted/spring-boot-loader/ ./
COPY --from=build /build/extracted/snapshot-dependencies/ ./
COPY --from=build /build/extracted/application/ ./

USER jipkok

ENV SPRING_PROFILES_ACTIVE=prod

EXPOSE 8080

ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
