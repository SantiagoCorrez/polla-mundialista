-- ============================================================
-- Polla Mundialista - MySQL Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS polla_mundialista
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE polla_mundialista;

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id CHAR(36) NOT NULL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_email (email),
    INDEX idx_users_username (username),
    INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TEAMS
-- ============================================================
CREATE TABLE IF NOT EXISTS teams (
    id CHAR(36) NOT NULL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    flag_url VARCHAR(500),
    country_code VARCHAR(10) NOT NULL UNIQUE,
    `group` VARCHAR(2) NOT NULL,
    INDEX idx_teams_group (`group`),
    INDEX idx_teams_country (country_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- MATCHES
-- ============================================================
CREATE TABLE IF NOT EXISTS matches (
    id CHAR(36) NOT NULL PRIMARY KEY,
    home_team_id CHAR(36) NOT NULL,
    away_team_id CHAR(36) NOT NULL,
    phase ENUM('GROUP_STAGE', 'ROUND_OF_32', 'ROUND_OF_16', 'QUARTER', 'SEMI', 'THIRD', 'FINAL') NOT NULL,
    `group` VARCHAR(2),
    match_date DATETIME NOT NULL,
    stadium VARCHAR(200),
    status ENUM('SCHEDULED', 'LIVE', 'FINISHED') NOT NULL DEFAULT 'SCHEDULED',
    home_score INT,
    away_score INT,
    home_score_final INT,
    away_score_final INT,
    qualified_team_id CHAR(36),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_matches_phase (phase),
    INDEX idx_matches_group (`group`),
    INDEX idx_matches_status (status),
    INDEX idx_matches_date (match_date),
    FOREIGN KEY (home_team_id) REFERENCES teams(id) ON DELETE RESTRICT,
    FOREIGN KEY (away_team_id) REFERENCES teams(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- PREDICTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS predictions (
    id CHAR(36) NOT NULL PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    match_id CHAR(36) NOT NULL,
    predicted_home INT NOT NULL,
    predicted_away INT NOT NULL,
    points INT,
    point_type ENUM('EXACT', 'WINNER_DIFF', 'WINNER', 'NONE'),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_match (user_id, match_id),
    INDEX idx_predictions_user (user_id),
    INDEX idx_predictions_match (match_id),
    INDEX idx_predictions_points (points),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TOURNAMENT PREDICTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS tournament_predictions (
    id CHAR(36) NOT NULL PRIMARY KEY,
    user_id CHAR(36) NOT NULL UNIQUE,
    champion_id CHAR(36),
    runner_up_id CHAR(36),
    third_place_id CHAR(36),
    fourth_place_id CHAR(36),
    top_scorer VARCHAR(200),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (champion_id) REFERENCES teams(id) ON DELETE SET NULL,
    FOREIGN KEY (runner_up_id) REFERENCES teams(id) ON DELETE SET NULL,
    FOREIGN KEY (third_place_id) REFERENCES teams(id) ON DELETE SET NULL,
    FOREIGN KEY (fourth_place_id) REFERENCES teams(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- REFRESH TOKENS
-- ============================================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id CHAR(36) NOT NULL PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    token VARCHAR(1000) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_refresh_user (user_id),
    INDEX idx_refresh_token (token(255)),
    INDEX idx_refresh_expires (expires_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
