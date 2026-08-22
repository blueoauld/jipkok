ALTER TABLE chat_room_member
    ADD COLUMN last_message_id BIGINT;

UPDATE chat_room_member crm
SET last_message_id = r.last_message_id
FROM chat_room r
WHERE r.id = crm.room_id;

ALTER TABLE chat_room_member
    ALTER COLUMN last_message_id SET NOT NULL;

CREATE INDEX idx_chat_room_member_member_id_last_message_id
    ON chat_room_member (member_id, last_message_id DESC);
