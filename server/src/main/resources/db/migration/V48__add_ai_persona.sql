CREATE TABLE ai_persona
(
    member_id                BIGINT PRIMARY KEY,
    enabled                  BOOLEAN                  NOT NULL DEFAULT TRUE,
    system_prompt            TEXT                     NOT NULL,
    reply_delay_min_seconds  INTEGER                  NOT NULL,
    reply_delay_max_seconds  INTEGER                  NOT NULL,
    active_start_hour        INTEGER                  NOT NULL,
    active_end_hour          INTEGER                  NOT NULL,
    daily_reply_limit        INTEGER                  NOT NULL,
    next_location_refresh_at TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    created_at               TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    updated_at               TIMESTAMP(6) WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_ai_persona_enabled_next_location_refresh_at ON ai_persona (enabled, next_location_refresh_at);
