-- Enabled at container init time by Docker's entrypoint.
-- pgvector: vector similarity search for agent embeddings/RAG
-- pg_trgm: trigram indexes for fuzzy text search on task titles/descriptions
CREATE EXTENSION IF NOT EXISTS "pgvector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
