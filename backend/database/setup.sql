-- ============================================================
-- Camella GuardTrack — Full Database Setup & Seed Script
-- Run this in phpMyAdmin > SQL tab, or MySQL command line
-- ============================================================

-- 1. Create & select the database
CREATE DATABASE IF NOT EXISTS camella_guardtrack
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE camella_guardtrack;

-- ============================================================
-- 2. DROP tables in reverse dependency order (safe re-run)
-- ============================================================
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS activity_logs;
DROP TABLE IF EXISTS gate_passes;
DROP TABLE IF EXISTS properties;
DROP TABLE IF EXISTS residents;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- 3. CREATE TABLES
-- ============================================================

-- Users table
CREATE TABLE users (
  id              INT           NOT NULL AUTO_INCREMENT,
  username        VARCHAR(100)  NOT NULL UNIQUE,
  email           VARCHAR(150)  NOT NULL UNIQUE,
  password_hash   VARCHAR(255)  NOT NULL,
  role            ENUM('admin','guard','resident') NOT NULL DEFAULT 'resident',
  is_active       TINYINT(1)    NOT NULL DEFAULT 1,
  createdAt       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Residents table
CREATE TABLE residents (
  id              INT           NOT NULL AUTO_INCREMENT,
  UserId          INT           DEFAULT NULL UNIQUE,
  full_name       VARCHAR(200)  NOT NULL,
  contact_number  VARCHAR(20)   DEFAULT NULL,
  profile_photo   VARCHAR(500)  DEFAULT NULL,
  createdAt       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_residents_user FOREIGN KEY (UserId) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Properties table
CREATE TABLE properties (
  id              INT           NOT NULL AUTO_INCREMENT,
  ResidentId      INT           NOT NULL,
  block           VARCHAR(20)   NOT NULL,
  lot             VARCHAR(20)   NOT NULL,
  street          VARCHAR(200)  DEFAULT NULL,
  phase           VARCHAR(50)   DEFAULT NULL,
  createdAt       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_block_lot (block, lot),
  CONSTRAINT fk_properties_resident FOREIGN KEY (ResidentId) REFERENCES residents (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Gate Passes table
CREATE TABLE gate_passes (
  id              INT           NOT NULL AUTO_INCREMENT,
  PropertyId      INT           NOT NULL,
  guest_name      VARCHAR(200)  NOT NULL,
  expected_date   DATE          NOT NULL,
  pass_id         VARCHAR(36)   NOT NULL UNIQUE,
  qr_token        TEXT          DEFAULT NULL,
  status          ENUM('active','checked_in','used','expired') NOT NULL DEFAULT 'active',
  scanned_at      DATETIME      DEFAULT NULL,
  scanned_by      INT           DEFAULT NULL,
  exited_at       DATETIME      DEFAULT NULL,
  exited_by       INT           DEFAULT NULL,
  notes           TEXT          DEFAULT NULL COMMENT 'Free-form guard notes (true notes, not encoded data)',
  purpose         VARCHAR(200)  DEFAULT NULL COMMENT 'Purpose of visit (e.g. Social Visit, Delivery)',
  proof_of_id     VARCHAR(100)  DEFAULT NULL COMMENT 'Type of ID presented by visitor',
  plate_number    VARCHAR(50)   DEFAULT NULL COMMENT 'Vehicle plate number',
  guard_notes     TEXT          DEFAULT NULL COMMENT 'Additional guard observations at time of scan',
  createdAt       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_pass_id   (pass_id),
  INDEX idx_status    (status),
  INDEX idx_date      (expected_date),
  CONSTRAINT fk_gatepasses_property  FOREIGN KEY (PropertyId) REFERENCES properties (id)  ON DELETE CASCADE,
  CONSTRAINT fk_gatepasses_guard     FOREIGN KEY (scanned_by) REFERENCES users (id)       ON DELETE SET NULL,
  CONSTRAINT fk_gatepasses_exitguard FOREIGN KEY (exited_by)  REFERENCES users (id)       ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Activity Logs table
CREATE TABLE activity_logs (
  id              INT           NOT NULL AUTO_INCREMENT,
  GatePassId      INT           NOT NULL,
  action          ENUM('entry','exit') NOT NULL,
  scanned_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  scanned_by      INT           DEFAULT NULL,
  notes           TEXT          DEFAULT NULL,
  createdAt       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_gatepass_id (GatePassId),
  INDEX idx_action      (action),
  INDEX idx_scanned_at   (scanned_at),
  CONSTRAINT fk_activitylogs_gatepass FOREIGN KEY (GatePassId) REFERENCES gate_passes (id) ON DELETE CASCADE,
  CONSTRAINT fk_activitylogs_guard    FOREIGN KEY (scanned_by) REFERENCES users (id)       ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 4. SEED DATA
-- All passwords are bcrypt hashes of the plain-text below:
--
--   admin1    → password: Admin@1234
--   guard1    → password: Guard@1234
--   guard2    → password: Guard@1234
--   resident1 → password: Resident@1234
--   resident2 → password: Resident@1234
--   resident3 → password: Resident@1234
--
-- Hash generated with bcrypt saltRounds=12
-- ============================================================

INSERT INTO users (username, email, password_hash, role, is_active) VALUES
-- Admin          password: Admin@1234
('admin',     'admin@camella.com',      '$2b$12$Kf4qMci47T.l.X2fyB1MXeHdWhd/eBZikT1xIopL91TGyP.wgQo1q', 'admin',    1),
-- Guards         password: Guard@1234
('guard1',     'guard1@camella.com',     '$2b$12$kd3ZxHxru3h/E5EsJgqjW.whZws9aVTuId43uv4RR4rBvWx5DMs06', 'guard',    1),
('guard2',     'guard2@camella.com',     '$2b$12$kd3ZxHxru3h/E5EsJgqjW.whZws9aVTuId43uv4RR4rBvWx5DMs06', 'guard',    1),
-- Residents      password: Resident@1234
('resident1',  'jbpachica@camella.com',       '$2b$12$eIa/2skM4FhdXJtjfKvuWeJYW.8rhI0lXJjUvKwGJsihFIhBVhzgO', 'resident', 1),
('resident2',  'dmcruz@camella.com',      '$2b$12$eIa/2skM4FhdXJtjfKvuWeJYW.8rhI0lXJjUvKwGJsihFIhBVhzgO', 'resident', 1),
('resident3',  'jdesplago@camella.com',      '$2b$12$eIa/2skM4FhdXJtjfKvuWeJYW.8rhI0lXJjUvKwGJsihFIhBVhzgO', 'resident', 1);

-- Residents profiles
INSERT INTO residents (UserId, full_name, contact_number) VALUES
(4, 'John Benedict Pachica',    '09171234567'),
(5, 'Dhan Mykell',      '09281234567'),
(6, 'John Daniel Esplago',       '09391234567');

-- Properties (each resident has 1 property, resident1 has 2)
INSERT INTO properties (ResidentId, block, lot, street, phase) VALUES
(1, '5',  '12', 'Sampaguita Street',  'Phase 1'),
(1, '5',  '13', 'Sampaguita Street',  'Phase 1'),  -- resident1 owns 2 lots
(2, '3',  '8',  'Rosal Street',       'Phase 1'),
(3, '7',  '21', 'Gumamela Avenue',    'Phase 2');

-- Sample Gate Passes (for log testing)
INSERT INTO gate_passes (PropertyId, guest_name, expected_date, pass_id, status, scanned_at, scanned_by, notes) VALUES
(1, 'Rob Daniel',       CURDATE(),              '11111111-1111-1111-1111-111111111111', 'active',  NULL,        NULL,  NULL),
(1, 'Zild Benitez',    DATE_SUB(CURDATE(),INTERVAL 1 DAY), '22222222-2222-2222-2222-222222222222', 'used', DATE_SUB(NOW(),INTERVAL 23 HOUR), 2, 'Arrived at 8:05 AM'),
(2, 'Unique Salonga',       DATE_SUB(CURDATE(),INTERVAL 2 DAY), '33333333-3333-3333-3333-333333333333', 'used', DATE_SUB(NOW(),INTERVAL 2 DAY),  2, NULL),
(3, 'Syd Hartha',    DATE_SUB(CURDATE(),INTERVAL 1 DAY), '44444444-4444-4444-4444-444444444444', 'expired', NULL, NULL, NULL),
(4, 'Sabrina Carpenter',     CURDATE(),              '55555555-5555-5555-5555-555555555555', 'active',  NULL,        NULL,  NULL);

-- ============================================================
-- 5. VERIFY — quick row counts
-- ============================================================
SELECT 'users'       AS tbl, COUNT(*) AS rows FROM users
UNION ALL
SELECT 'residents',           COUNT(*)         FROM residents
UNION ALL
SELECT 'properties',          COUNT(*)         FROM properties
UNION ALL
SELECT 'gate_passes',         COUNT(*)         FROM gate_passes
UNION ALL
SELECT 'activity_logs',       COUNT(*)         FROM activity_logs;
