ALTER TABLE messages ADD COLUMN origin_key VARCHAR(500) NOT NULL;
ALTER TABLE messages ADD COLUMN target_key VARCHAR(500) NOT NULL;