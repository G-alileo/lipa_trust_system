-- LipaTrust: Database Initialization and Migration Script
-- Target Database: MySQL 8.0 
-- Author: LipaTrust AI Implementation
-- No emojis as per user request

-- 0. Database Setup (Optional/System specific)
-- CREATE DATABASE IF NOT EXISTS lipatrust_db;
-- USE lipatrust_db;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255),
    hashed_password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Campaigns Table
CREATE TABLE IF NOT EXISTS campaigns (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    owner_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_amount DECIMAL(12, 2) NOT NULL,
    current_amount DECIMAL(12, 2) DEFAULT 0.00,
    status ENUM('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED', 'FAILED', 'REFUND_PENDING', 'REFUNDED') NOT NULL,
    deadline DATETIME,
    paybill_number VARCHAR(20) NOT NULL,
    account_reference VARCHAR(50) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- 3. Contributions Table
CREATE TABLE IF NOT EXISTS contributions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    campaign_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    mpesa_receipt VARCHAR(50) UNIQUE,
    checkout_request_id VARCHAR(100) UNIQUE,
    status ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED') NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 4. Accounts Table (for Ledger)
CREATE TABLE IF NOT EXISTS accounts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL
);

-- 5. Ledger Entries Table
CREATE TABLE IF NOT EXISTS ledger_entries (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    campaign_id BIGINT NOT NULL,
    reference_id VARCHAR(100) NOT NULL,
    account VARCHAR(50) NOT NULL,
    entry_type ENUM('DEBIT', 'CREDIT') NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
);

-- 6. Disbursements Table
CREATE TABLE IF NOT EXISTS disbursements (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    campaign_id BIGINT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    status ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED') NOT NULL,
    conversation_id VARCHAR(100),
    raw_payload JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
);

-- 7. Refunds Table
CREATE TABLE IF NOT EXISTS refunds (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    contribution_id BIGINT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    status ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED') NOT NULL,
    attempts INT DEFAULT 0,
    raw_payload JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contribution_id) REFERENCES contributions(id)
);

--------------------------------------------------------------------------------
-- SEED DATA
--------------------------------------------------------------------------------

-- Insert Demo Users
-- Password for all is 'LipaTrust2026' (Hashed with PassLib default/Mock)
INSERT INTO users (id, phone_number, email, hashed_password, is_admin) VALUES
(1, '254712345678', 'admin@lipatrust.com', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6L6s57gHR.9XzS.6', TRUE),
(2, '254722222222', 'jane.doe@example.com', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6L6s57gHR.9XzS.6', FALSE),
(3, '254733333333', 'mike.smith@example.com', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6L6s57gHR.9XzS.6', FALSE);

-- Insert Demo Accounts
INSERT INTO accounts (id, name) VALUES
(1, 'PLATFORM_COLLECTION'),
(2, 'CAMPAIGN_ESCROW'),
(3, 'DISBURSEMENT_SETTLEMENT');

-- Insert Demo Campaigns
INSERT INTO campaigns (id, owner_id, title, description, target_amount, current_amount, status, paybill_number, account_reference, is_verified) VALUES
(1, 2, 'Medical Fund for Baby Aisha', 'Support Baby Aisha who needs an urgent heart surgery. We are raising funds to cover the specialized treatment and travel costs.', 2500000.00, 1250500.00, 'ACTIVE', '222111', 'AISHA-HEART', TRUE),
(2, 3, 'Clean Water for Kajiado Village', 'A community project to drill a borehole and install solar pumps to provide clean, sustainable water to over 500 households.', 800000.00, 800000.00, 'COMPLETED', '333444', 'KAJIADO-WATER', TRUE),
(3, 2, 'RenewTech Innovation Hub', 'Empowering local engineers with tools and workspace to build renewable energy solutions for rural Kenya.', 500000.00, 0.00, 'DRAFT', '555666', 'RENEWTECH-2026', FALSE);

-- Insert Demo Contributions
INSERT INTO contributions (id, campaign_id, user_id, amount, mpesa_receipt, status) VALUES
(1, 1, 3, 5000.00, 'RCD123XRT4', 'COMPLETED'),
(2, 1, 1, 1000.00, 'RCD456YUI9', 'COMPLETED'),
(3, 2, 2, 800000.00, 'RCD789OPA1', 'COMPLETED');

-- Insert Sample Ledger Entries
INSERT INTO ledger_entries (campaign_id, reference_id, account, entry_type, amount) VALUES
(1, 'RCD123XRT4', 'PLATFORM_COLLECTION', 'CREDIT', 5000.00),
(1, 'RCD456YUI9', 'PLATFORM_COLLECTION', 'CREDIT', 1000.00),
(2, 'RCD789OPA1', 'PLATFORM_COLLECTION', 'CREDIT', 800000.00);

-- Insert Sample Disbursement (for the completed campaign)
INSERT INTO disbursements (campaign_id, amount, status, conversation_id) VALUES
(2, 800000.00, 'COMPLETED', 'AG_DISB_778899');
