ALTER TABLE ai_reply_log
    ADD COLUMN cached_tokens INTEGER NOT NULL DEFAULT 0;
