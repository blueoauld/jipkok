ALTER TABLE apple_ads_keyword_daily
    ADD COLUMN suggested_bid_amount NUMERIC(14, 4),
    ADD COLUMN bid_min              NUMERIC(14, 4),
    ADD COLUMN bid_max              NUMERIC(14, 4);
