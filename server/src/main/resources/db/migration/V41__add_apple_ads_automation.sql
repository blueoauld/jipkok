CREATE TABLE apple_ads_automation
(
    id                        BIGINT                      NOT NULL,
    created_at                TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    updated_at                TIMESTAMP(6) WITH TIME ZONE NOT NULL,
    enabled                   BOOLEAN                     NOT NULL,
    daily_limit               INTEGER                     NOT NULL,
    auto_pause_keyword        BOOLEAN                     NOT NULL,
    auto_add_negative_keyword BOOLEAN                     NOT NULL,
    auto_lower_bid            BOOLEAN                     NOT NULL,
    auto_raise_bid            BOOLEAN                     NOT NULL,
    auto_add_keyword          BOOLEAN                     NOT NULL,
    updated_by_id             BIGINT,
    CONSTRAINT pk_apple_ads_automation PRIMARY KEY (id)
);

ALTER TABLE apple_ads_action
    ALTER COLUMN actor_id DROP NOT NULL,
    ADD COLUMN automatic BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX idx_apple_ads_action_automatic_created_at ON apple_ads_action (automatic, created_at);
