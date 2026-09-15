ALTER TABLE ai_persona
    ADD COLUMN greeting_enabled     BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN daily_greeting_limit INTEGER NOT NULL DEFAULT 20;

CREATE TABLE ai_greeting_job
(
    member_id      BIGINT PRIMARY KEY,
    state          VARCHAR(20)                 NOT NULL,
    due_at         TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    attempts       INTEGER                     NOT NULL DEFAULT 0,
    ai_member_id   BIGINT,
    room_id        BIGINT,
    sent_at        TIMESTAMP(6) WITH TIME ZONE,
    dropped_reason VARCHAR(100),
    created_at     TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    updated_at     TIMESTAMP(6) WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_ai_greeting_job_pending_due_at ON ai_greeting_job (due_at) WHERE state = 'PENDING';
CREATE INDEX idx_ai_greeting_job_ai_member_id_sent_at ON ai_greeting_job (ai_member_id, sent_at) WHERE state = 'SENT';
