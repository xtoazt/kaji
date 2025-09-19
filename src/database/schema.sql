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
('Authentication Bypass', 'Login mechanism vulnerabilities', 8)
ON CONFLICT (name) DO NOTHING;

-- Insert some initial ChromeOS versions
INSERT INTO chromeos_versions (version, build_number, release_date, is_current) VALUES
('120.0.6099.129', '120.0.6099.129', '2024-01-15', true),
('119.0.6045.215', '119.0.6045.215', '2023-12-10', false),
('118.0.5993.117', '118.0.5993.117', '2023-11-20', false),
('117.0.5938.157', '117.0.5938.157', '2023-10-25', false)
ON CONFLICT (version) DO NOTHING;
