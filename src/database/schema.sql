-- Kaji ChromeOS Vulnerability Research Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table for authentication and user management
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'researcher', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- ChromeOS versions table
CREATE TABLE IF NOT EXISTS chromeos_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    version VARCHAR(50) UNIQUE NOT NULL,
    build_number VARCHAR(50),
    release_date DATE,
    end_of_life_date DATE,
    is_stable BOOLEAN DEFAULT true,
    is_current BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Vulnerability categories
CREATE TABLE IF NOT EXISTS vulnerability_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    severity_level INTEGER CHECK (severity_level BETWEEN 1 AND 10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Exploits table
CREATE TABLE IF NOT EXISTS exploits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cve_id VARCHAR(20) UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
    cvss_score DECIMAL(3,1) CHECK (cvss_score BETWEEN 0.0 AND 10.0),
    category_id UUID REFERENCES vulnerability_categories(id),
    chromeos_version_id UUID REFERENCES chromeos_versions(id),
    discovered_date DATE,
    disclosed_date DATE,
    patched_date DATE,
    exploit_code TEXT,
    proof_of_concept TEXT,
    references JSONB,
    tags TEXT[],
    is_verified BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI training data table
CREATE TABLE IF NOT EXISTS ai_training_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exploit_id UUID REFERENCES exploits(id) ON DELETE CASCADE,
    training_prompt TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    model_version VARCHAR(50),
    confidence_score DECIMAL(3,2) CHECK (confidence_score BETWEEN 0.0 AND 1.0),
    is_validated BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User reports table for error reporting and feedback
CREATE TABLE IF NOT EXISTS user_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    report_type VARCHAR(50) CHECK (report_type IN ('error', 'false_positive', 'missing_exploit', 'suggestion')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    exploit_id UUID REFERENCES exploits(id),
    chromeos_version_id UUID REFERENCES chromeos_versions(id),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'accepted', 'rejected')),
    ai_analysis TEXT,
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI chat sessions for user interactions
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    session_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- System logs for monitoring and debugging
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level VARCHAR(20) CHECK (level IN ('debug', 'info', 'warn', 'error', 'fatal')),
    message TEXT NOT NULL,
    context JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_exploits_chromeos_version ON exploits(chromeos_version_id);
CREATE INDEX IF NOT EXISTS idx_exploits_severity ON exploits(severity);
CREATE INDEX IF NOT EXISTS idx_exploits_discovered_date ON exploits(discovered_date);
CREATE INDEX IF NOT EXISTS idx_exploits_cve_id ON exploits(cve_id);
CREATE INDEX IF NOT EXISTS idx_user_reports_status ON user_reports(status);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);

-- Insert default vulnerability categories
INSERT INTO vulnerability_categories (name, description, severity_level) VALUES
('Buffer Overflow', 'Memory corruption vulnerabilities', 8),
('Use After Free', 'Memory management vulnerabilities', 7),
('Integer Overflow', 'Numeric calculation vulnerabilities', 6),
('Race Condition', 'Concurrency-related vulnerabilities', 7),
('Privilege Escalation', 'Authorization bypass vulnerabilities', 9),
('Information Disclosure', 'Data exposure vulnerabilities', 5),
('Denial of Service', 'Service disruption vulnerabilities', 6),
('Code Injection', 'Remote code execution vulnerabilities', 9),
('Cross-Site Scripting', 'Web-based injection vulnerabilities', 6),
('Authentication Bypass', 'Login mechanism vulnerabilities', 8),
('Extension Bypass', 'Chrome extension restriction bypasses', 7),
('Bookmarklet Exploit', 'JavaScript bookmarklet-based exploits', 6),
('WebView Exploit', 'Chrome WebView component exploits', 8),
('Policy Bypass', 'ChromeOS policy enforcement bypasses', 7),
('Extension Removal', 'Chrome extension removal exploits', 6),
('DevTools Bypass', 'Developer tools restriction bypasses', 5),
('Network Filter Bypass', 'Network filtering and blocking bypasses', 6),
('uBlock Exploit', 'uBlock Origin extension exploits', 5),
('QuickOffice Exploit', 'QuickOffice component exploits', 7),
('OneTab Exploit', 'OneTab extension exploits', 4)
ON CONFLICT (name) DO NOTHING;

-- Insert historical ChromeOS versions (extended list)
INSERT INTO chromeos_versions (version, build_number, release_date, is_current) VALUES
-- Current versions
('121.0.6167.85', '121.0.6167.85', '2024-01-20', true),
('120.0.6099.129', '120.0.6099.129', '2024-01-15', false),
('119.0.6045.215', '119.0.6045.215', '2023-12-10', false),
('118.0.5993.117', '118.0.5993.117', '2023-11-20', false),
('117.0.5938.157', '117.0.5938.157', '2023-10-25', false),
-- 2023 versions
('116.0.5845.187', '116.0.5845.187', '2023-09-20', false),
('115.0.5790.102', '115.0.5790.102', '2023-08-15', false),
('114.0.5735.133', '114.0.5735.133', '2023-07-10', false),
('113.0.5672.126', '113.0.5672.126', '2023-06-05', false),
('112.0.5615.121', '112.0.5615.121', '2023-04-25', false),
('111.0.5563.110', '111.0.5563.110', '2023-03-20', false),
('110.0.5481.177', '110.0.5481.177', '2023-02-14', false),
('109.0.5414.125', '109.0.5414.125', '2023-01-10', false),
-- 2022 versions
('108.0.5359.124', '108.0.5359.124', '2022-11-29', false),
('107.0.5304.110', '107.0.5304.110', '2022-10-25', false),
('106.0.5249.119', '106.0.5249.119', '2022-09-27', false),
('105.0.5195.134', '105.0.5195.134', '2022-08-30', false),
('104.0.5112.105', '104.0.5112.105', '2022-08-02', false),
('103.0.5060.114', '103.0.5060.114', '2022-06-21', false),
('102.0.5005.115', '102.0.5005.115', '2022-05-24', false),
('101.0.4951.64', '101.0.4951.64', '2022-04-26', false),
('100.0.4896.133', '100.0.4896.133', '2022-03-29', false),
('99.0.4844.88', '99.0.4844.88', '2022-03-01', false),
('98.0.4758.107', '98.0.4758.107', '2022-02-01', false),
('97.0.4692.99', '97.0.4692.99', '2022-01-04', false),
-- 2021 versions
('96.0.4664.111', '96.0.4664.111', '2021-12-07', false),
('95.0.4638.78', '95.0.4638.78', '2021-11-02', false),
('94.0.4606.104', '94.0.4606.104', '2021-09-21', false),
('93.0.4577.82', '93.0.4577.82', '2021-08-31', false),
('92.0.4515.159', '92.0.4515.159', '2021-08-03', false),
('91.0.4472.164', '91.0.4472.164', '2021-07-13', false),
('90.0.4430.218', '90.0.4430.218', '2021-06-15', false),
('89.0.4389.128', '89.0.4389.128', '2021-05-18', false),
('88.0.4324.186', '88.0.4324.186', '2021-04-20', false),
('87.0.4280.109', '87.0.4280.109', '2021-03-23', false),
('86.0.4240.199', '86.0.4240.199', '2021-02-23', false),
('85.0.4183.133', '85.0.4183.133', '2021-01-26', false),
-- 2020 versions
('84.0.4147.125', '84.0.4147.125', '2020-12-01', false),
('83.0.4103.119', '83.0.4103.119', '2020-10-20', false),
('82.0.4085.127', '82.0.4085.127', '2020-08-25', false),
('81.0.4044.127', '81.0.4044.127', '2020-06-16', false),
('80.0.3987.158', '80.0.3987.158', '2020-04-07', false),
('79.0.3945.123', '79.0.3945.123', '2020-01-21', false),
-- 2019 versions
('78.0.3904.108', '78.0.3904.108', '2019-12-10', false),
('77.0.3865.120', '77.0.3865.120', '2019-10-22', false),
('76.0.3809.136', '76.0.3809.136', '2019-08-20', false),
('75.0.3770.103', '75.0.3770.103', '2019-06-18', false),
('74.0.3729.162', '74.0.3729.162', '2019-04-23', false),
('73.0.3683.88', '73.0.3683.88', '2019-03-12', false),
('72.0.3626.122', '72.0.3626.122', '2019-01-29', false),
-- 2018 versions
('71.0.3578.127', '71.0.3578.127', '2018-12-11', false),
('70.0.3538.110', '70.0.3538.110', '2018-10-16', false),
('69.0.3497.100', '69.0.3497.100', '2018-09-04', false),
('68.0.3440.118', '68.0.3440.118', '2018-07-24', false),
('67.0.3396.99', '67.0.3396.99', '2018-05-29', false),
('66.0.3359.203', '66.0.3359.203', '2018-04-17', false),
('65.0.3325.209', '65.0.3325.209', '2018-03-06', false),
('64.0.3282.190', '64.0.3282.190', '2018-01-24', false)
ON CONFLICT (version) DO NOTHING;
