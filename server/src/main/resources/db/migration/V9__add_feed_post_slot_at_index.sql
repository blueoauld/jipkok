CREATE INDEX idx_feed_post_slot_at_id ON feed_post (slot_at, id)
    WHERE deleted_at IS NULL;
