CREATE INDEX idx_worry_post_deleted_at ON worry_post (deleted_at)
    WHERE deleted_at IS NOT NULL;

CREATE INDEX idx_worry_comment_deleted_at ON worry_comment (deleted_at)
    WHERE deleted_at IS NOT NULL;

CREATE INDEX idx_worry_comment_parent_id ON worry_comment (parent_id)
    WHERE parent_id IS NOT NULL;

CREATE INDEX idx_chat_room_high_member_id ON chat_room (high_member_id)
    WHERE deleted_at IS NULL;
