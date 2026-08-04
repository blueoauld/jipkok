CREATE INDEX idx_member_active_located ON member (located_at DESC, id DESC)
    WHERE deleted_at IS NULL AND located_at IS NOT NULL;

CREATE INDEX idx_member_active_gender_located ON member (gender, located_at DESC, id DESC)
    WHERE deleted_at IS NULL AND located_at IS NOT NULL;

CREATE INDEX idx_member_active_like_count ON member (received_like_count DESC, id DESC)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_member_active_nickname ON member (lower(nickname) text_pattern_ops)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_member_active_location ON member
    USING gist (geography(st_makepoint(longitude, latitude)))
    WHERE deleted_at IS NULL AND latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE INDEX idx_member_block_blocked_member_id_blocker_id
    ON member_block (blocked_member_id, blocker_id);

DROP INDEX idx_member_block_blocked_member_id;
