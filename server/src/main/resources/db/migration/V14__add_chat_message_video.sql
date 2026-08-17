ALTER TABLE chat_message
    ADD COLUMN thumbnail_object_key VARCHAR(255);

ALTER TABLE chat_message
    ADD COLUMN duration_seconds INTEGER;
