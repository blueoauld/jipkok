ALTER TABLE phone_verification
    ADD COLUMN purpose VARCHAR(20) NOT NULL DEFAULT 'SIGNUP';

ALTER TABLE phone_verification
    ALTER COLUMN purpose DROP DEFAULT;
