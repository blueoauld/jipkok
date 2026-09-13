ALTER TABLE member
    ADD COLUMN grid_latitude DOUBLE PRECISION GENERATED ALWAYS AS (
        CASE WHEN latitude IS NOT NULL THEN (least(floor(latitude * 100), 8999) + 0.5) / 100 END
    ) STORED,
    ADD COLUMN grid_longitude DOUBLE PRECISION GENERATED ALWAYS AS (
        CASE WHEN longitude IS NOT NULL THEN (least(floor(longitude * 100), 17999) + 0.5) / 100 END
    ) STORED;

DROP INDEX idx_member_active_location;

CREATE INDEX idx_member_active_grid_location ON member
    USING gist (geography(st_makepoint(grid_longitude, grid_latitude)))
    WHERE deleted_at IS NULL AND latitude IS NOT NULL AND longitude IS NOT NULL;
