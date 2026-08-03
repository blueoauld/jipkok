ALTER TABLE member
    DROP CONSTRAINT IF EXISTS member_phone_number_key;
ALTER TABLE member
    DROP CONSTRAINT IF EXISTS member_nickname_key;

CREATE UNIQUE INDEX uk_member_phone_number ON member (phone_number) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX uk_member_nickname ON member (nickname) WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX uk_chat_room_members ON chat_room (low_member_id, high_member_id) WHERE deleted_at IS NULL;
