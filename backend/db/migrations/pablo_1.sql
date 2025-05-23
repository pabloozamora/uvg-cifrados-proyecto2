CREATE DATABASE proyecto2_cifrados;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(256) NOT NULL UNIQUE,
  password_hash VARCHAR(256),
  mfa_enabled BOOLEAN DEFAULT false,
  totp_secret VARCHAR(256),
  provider ENUM('local', 'google') NOT NULL DEFAULT 'local',
  google_id VARCHAR(256),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);