package dev.codecrafter.judge.sandbox;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum Language {
    JAVA(
        "java",
        "eclipse-temurin:21-jdk-alpine",
        "Main.java",
        "javac /workspace/Main.java -d /tmp/out",
        "java -cp /tmp/out Main"
    ),
    PYTHON(
        "python",
        "python:3.12-slim",
        "solution.py",
        null,
        "python /workspace/solution.py"
    ),
    CPP(
        "cpp",
        "gcc:13",
        "solution.cpp",
        "g++ -O2 -o /tmp/solution /workspace/solution.cpp",
        "/tmp/solution"
    ),
    C(
        "c",
        "gcc:13",
        "solution.c",
        "gcc -O2 -o /tmp/solution /workspace/solution.c",
        "/tmp/solution"
    ),
    JAVASCRIPT(
        "javascript",
        "node:22-alpine",
        "solution.js",
        null,
        "node /workspace/solution.js"
    ),
    GO(
        "go",
        "golang:1.23-alpine",
        "solution.go",
        "go build -o /tmp/solution /workspace/solution.go",
        "/tmp/solution"
    ),
    RUST(
        "rust",
        "rust:1.81-slim",
        "solution.rs",
        "rustc -o /tmp/solution /workspace/solution.rs",
        "/tmp/solution"
    );

    private final String key;
    private final String dockerImage;
    private final String sourceFileName;
    private final String compileCommand;
    private final String runCommand;

    public boolean isCompiled() {
        return compileCommand != null;
    }

    public static Language fromKey(String key) {
        for (Language lang : values()) {
            if (lang.key.equalsIgnoreCase(key)) return lang;
        }
        throw new IllegalArgumentException("Unsupported language: " + key);
    }
}
