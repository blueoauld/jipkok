CREATE INDEX idx_attendance_member_id_attended_on
    ON attendance (member_id, attended_on);
