CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;

CREATE INDEX idx_worry_post_content_trgm ON worry_post USING gin (content gin_trgm_ops) WHERE deleted_at IS NULL;
