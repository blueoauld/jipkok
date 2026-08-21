ALTER TABLE worry_comment
    ADD COLUMN parent_id BIGINT;

CREATE INDEX idx_worry_comment_post_id_thread
    ON worry_comment (post_id, (COALESCE(parent_id, id)), id);
