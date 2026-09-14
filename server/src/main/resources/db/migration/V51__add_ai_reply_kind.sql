ALTER TABLE ai_reply_job
    ADD COLUMN kind VARCHAR(20) NOT NULL DEFAULT 'REPLY';

ALTER TABLE ai_reply_log
    ADD COLUMN kind VARCHAR(20) NOT NULL DEFAULT 'REPLY';

CREATE INDEX idx_ai_reply_log_room_id_kind_message_id ON ai_reply_log (room_id, kind, message_id);
