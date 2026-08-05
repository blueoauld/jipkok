ALTER TABLE chat_room_member
    ADD COLUMN notification_enabled BOOLEAN DEFAULT TRUE NOT NULL;
