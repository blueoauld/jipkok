CREATE INDEX idx_member_deleted_at ON member (deleted_at)
    WHERE deleted_at IS NOT NULL;

CREATE INDEX idx_chat_room_deleted_at ON chat_room (deleted_at)
    WHERE deleted_at IS NOT NULL;

CREATE INDEX idx_feed_post_deleted_at ON feed_post (deleted_at)
    WHERE deleted_at IS NOT NULL;
