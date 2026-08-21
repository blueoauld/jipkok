ALTER TABLE worry_comment
    ADD COLUMN deleted_by_report BOOLEAN DEFAULT FALSE NOT NULL;
