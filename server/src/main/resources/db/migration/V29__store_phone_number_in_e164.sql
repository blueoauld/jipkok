ALTER TABLE member ALTER COLUMN phone_number TYPE VARCHAR(16);
ALTER TABLE attendance ALTER COLUMN phone_number TYPE VARCHAR(16);
ALTER TABLE access_reward ALTER COLUMN phone_number TYPE VARCHAR(16);
ALTER TABLE access_log ALTER COLUMN phone_number TYPE VARCHAR(16);
ALTER TABLE ad_reward ALTER COLUMN phone_number TYPE VARCHAR(16);
ALTER TABLE member_suspension ALTER COLUMN phone_number TYPE VARCHAR(16);
ALTER TABLE phone_verification ALTER COLUMN phone_number TYPE VARCHAR(16);
ALTER TABLE report ALTER COLUMN reported_phone_number TYPE VARCHAR(16);

UPDATE member SET phone_number = '+82' || substring(phone_number from 2);
UPDATE attendance SET phone_number = '+82' || substring(phone_number from 2);
UPDATE access_reward SET phone_number = '+82' || substring(phone_number from 2);
UPDATE access_log SET phone_number = '+82' || substring(phone_number from 2);
UPDATE ad_reward SET phone_number = '+82' || substring(phone_number from 2);
UPDATE member_suspension SET phone_number = '+82' || substring(phone_number from 2);
UPDATE phone_verification SET phone_number = '+82' || substring(phone_number from 2);

UPDATE report
SET reported_phone_number = '+82' || substring(reported_phone_number from 2)
WHERE reported_phone_number IS NOT NULL;

UPDATE report_snapshot
SET content = jsonb_set(
        content,
        '{reported,phoneNumber}',
        to_jsonb('+82' || substring(content -> 'reported' ->> 'phoneNumber' from 2))
              )
WHERE content -> 'reported' ->> 'phoneNumber' IS NOT NULL;
