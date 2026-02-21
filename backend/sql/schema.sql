-- FinVantage ML Platform — MySQL Schema
-- Run this script against your MySQL database to create the required tables.

CREATE DATABASE IF NOT EXISTS finvantage;
USE finvantage;

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    full_name       VARCHAR(100) NOT NULL,
    age             INT NOT NULL,
    dependents      INT DEFAULT 0,
    marital_status  ENUM('Single','Married','Divorced','Widowed') NOT NULL,
    employment_length VARCHAR(10) NOT NULL,
    home_ownership  ENUM('RENT','OWN','MORTGAGE') NOT NULL,
    cibil_score     INT NOT NULL CHECK (cibil_score BETWEEN 300 AND 900),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Loan Applications table
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

-- 3. Risk Predictions table (ML output)
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

-- Indexes for common queries
CREATE INDEX idx_loan_user ON loan_applications(user_id);
CREATE INDEX idx_pred_app ON risk_predictions(application_id);
