ALTER TABLE chat_message
    ADD COLUMN client_message_id VARCHAR(36);

ALTER TABLE chat_message
    ADD CONSTRAINT uk_chat_message_room_id_client_message_id UNIQUE (room_id, client_message_id);
