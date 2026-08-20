ALTER TABLE report
    ADD COLUMN reported_phone_number VARCHAR(11);

UPDATE report r
SET reported_phone_number = s.content::jsonb -> 'reported' ->> 'phoneNumber'
FROM report_snapshot s
WHERE s.report_id = r.id;

CREATE INDEX idx_report_reported_phone_number ON report (reported_phone_number);
