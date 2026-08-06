ALTER TABLE report
    ADD COLUMN handled_at TIMESTAMP(6) WITH TIME ZONE;

CREATE INDEX idx_report_handled_at ON report (handled_at);
