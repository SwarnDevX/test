# ── Build stage ──────────────────────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /build

COPY pom.xml .
COPY backend/pom.xml ./backend/
COPY judge-worker/pom.xml ./judge-worker/

RUN mvn -pl judge-worker -am dependency:go-offline -q

COPY judge-worker/src ./judge-worker/src
RUN mvn -pl judge-worker package -DskipTests -q

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# docker CLI needed to spawn sandbox containers
RUN apk add --no-cache docker-cli

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
# appuser needs docker group access (will be the docker GID on host)
RUN addgroup -S docker || true && adduser appuser docker || true

COPY --from=build /build/judge-worker/target/*.jar app.jar

USER appuser
EXPOSE 8081

ENTRYPOINT ["java", \
    "-XX:+UseVirtualThreads", \
    "-XX:+UseContainerSupport", \
    "-XX:MaxRAMPercentage=75.0", \
    "-jar", "app.jar"]
