CREATE TABLE ai_room_memory
(
    room_id               BIGINT PRIMARY KEY,
    ai_member_id          BIGINT                      NOT NULL,
    summary               TEXT                        NOT NULL,
    summarized_message_id BIGINT                      NOT NULL,
    created_at            TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    updated_at            TIMESTAMP(6) WITH TIME ZONE NOT NULL
);
