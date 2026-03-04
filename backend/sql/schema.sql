-- FinVantage ML Platform — MySQL Schema
-- Run this script against your MySQL database to create the required tables.

CREATE DATABASE IF NOT EXISTS finvantage;
USE finvantage;

-- NOTE: In production, create separate MySQL users with least-privilege grants:
--   GRANT SELECT, INSERT ON finvantage.* TO 'app_user'@'%';
--   GRANT SELECT ON finvantage.risk_predictions TO 'readonly_user'@'%';

-- 1. Auth Users table (credentials with bcrypt-hashed passwords)
CREATE TABLE IF NOT EXISTS auth_users (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    full_name       VARCHAR(100) NOT NULL,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_auth_email (email)
);

-- 2. Users table (applicant profile snapshot per assessment)
CREATE TABLE IF NOT EXISTS users (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    auth_user_id    INT NOT NULL,
    full_name       VARCHAR(100) NOT NULL,
    age             INT NOT NULL,
    dependents      INT DEFAULT 0,
    marital_status  ENUM('Single','Married','Divorced','Widowed') NOT NULL,
    employment_length VARCHAR(10) NOT NULL,
    home_ownership  ENUM('RENT','OWN','MORTGAGE') NOT NULL,
    cibil_score     INT NOT NULL CHECK (cibil_score BETWEEN 300 AND 900),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (auth_user_id) REFERENCES auth_users(id) ON DELETE CASCADE
);

-- 3. Loan Applications table
CREATE TABLE IF NOT EXISTS loan_applications (
    id                INT AUTO_INCREMENT PRIMARY KEY,
    user_id           INT NOT NULL,
    annual_income     DECIMAL(15,2) NOT NULL,
    monthly_debt      DECIMAL(15,2) NOT NULL,
    total_investments DECIMAL(15,2) DEFAULT 0,
    bank_balance      DECIMAL(15,2) DEFAULT 0,
    loan_amount       DECIMAL(15,2) NOT NULL,
    loan_purpose      ENUM('Business','Education','Home','Personal','Medical','Auto') NOT NULL,
    interest_rate     DECIMAL(5,2) NOT NULL,
    loan_term_months  INT NOT NULL,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Risk Predictions table (ML output)
CREATE TABLE IF NOT EXISTS risk_predictions (
    id                    INT AUTO_INCREMENT PRIMARY KEY,
    application_id        INT NOT NULL,
    credit_score          INT NOT NULL,
    probability_of_default DECIMAL(5,2) NOT NULL,
    approval_status       ENUM('High','Medium','Low') NOT NULL,
    dti_ratio             DECIMAL(5,2),
    wealth_coverage       DECIMAL(5,2),
    feature_importance    JSON,
    ai_insights           JSON,
    model_version         VARCHAR(50) DEFAULT 'rf_v1',
    created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES loan_applications(id) ON DELETE CASCADE
);

-- 5. Assessment History view (denormalized for fast reads)
CREATE TABLE IF NOT EXISTS assessment_history (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    auth_user_id    INT NOT NULL,
    user_name       VARCHAR(100) NOT NULL,
    assessment_input JSON NOT NULL,
    credit_score    INT NOT NULL,
    probability_of_default DECIMAL(5,2) NOT NULL,
    approval_status ENUM('High','Medium','Low') NOT NULL,
    status_label    VARCHAR(20) NOT NULL,
    health_metrics  JSON,
    breakdown       JSON,
    ai_insights     JSON,
    prediction_id   INT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (auth_user_id) REFERENCES auth_users(id) ON DELETE CASCADE,
    INDEX idx_history_user (auth_user_id),
    INDEX idx_history_date (created_at DESC)
);

-- Indexes for common queries
CREATE INDEX idx_users_auth ON users(auth_user_id);
CREATE INDEX idx_loan_user ON loan_applications(user_id);
CREATE INDEX idx_pred_app ON risk_predictions(application_id);
