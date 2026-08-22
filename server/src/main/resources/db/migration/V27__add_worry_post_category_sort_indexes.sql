CREATE INDEX idx_worry_post_category_like_count_id
    ON worry_post (category, like_count DESC, id DESC) WHERE deleted_at IS NULL;

CREATE INDEX idx_worry_post_category_comment_count_id
    ON worry_post (category, comment_count DESC, id DESC) WHERE deleted_at IS NULL;
