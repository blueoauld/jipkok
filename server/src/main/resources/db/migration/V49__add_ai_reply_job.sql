CREATE TABLE ai_reply_job
(
    room_id         BIGINT PRIMARY KEY,
    ai_member_id    BIGINT                      NOT NULL,
    last_message_id BIGINT                      NOT NULL,
    due_at          TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    attempts        INTEGER                     NOT NULL DEFAULT 0,
    created_at      TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    updated_at      TIMESTAMP(6) WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_ai_reply_job_due_at ON ai_reply_job (due_at);
