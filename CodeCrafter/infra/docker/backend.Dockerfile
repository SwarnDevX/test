# ── Build stage ──────────────────────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /build

# Copy POMs first for dependency caching
COPY pom.xml .
COPY backend/pom.xml ./backend/
COPY judge-worker/pom.xml ./judge-worker/

# Resolve dependencies (cache layer — only invalidated when pom.xml changes)
RUN mvn -pl backend -am dependency:go-offline -q

# Copy source and build
COPY backend/src ./backend/src
RUN mvn -pl backend package -DskipTests -q

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine AS production
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=build /build/backend/target/*.jar app.jar

USER appuser
EXPOSE 8080

ENTRYPOINT ["java", \
    "-XX:+UseVirtualThreads", \
    "-XX:+UseContainerSupport", \
    "-XX:MaxRAMPercentage=75.0", \
    "-jar", "app.jar"]

# ── Development stage (used by docker-compose.override.yml) ──────────────────
FROM production AS development
USER root
RUN apk add --no-cache curl
USER appuser
ENTRYPOINT ["java", \
    "-XX:+UseVirtualThreads", \
    "-XX:+UseContainerSupport", \
    "-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005", \
    "-jar", "app.jar"]
