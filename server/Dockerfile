FROM eclipse-temurin:25-jre-alpine

RUN addgroup --system jipkok && adduser --system --ingroup jipkok jipkok

WORKDIR /app

COPY build/extracted/dependencies/ ./
COPY build/extracted/spring-boot-loader/ ./
COPY build/extracted/snapshot-dependencies/ ./
COPY build/extracted/application/ ./

USER jipkok

ENV SPRING_PROFILES_ACTIVE=prod

EXPOSE 8080

ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
