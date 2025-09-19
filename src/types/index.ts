export interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'researcher' | 'admin';
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
}

export interface ChromeOSVersion {
  id: string;
  version: string;
  build_number?: string;
  release_date?: Date;
  end_of_life_date?: Date;
  is_stable: boolean;
  is_current: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface VulnerabilityCategory {
  id: string;
  name: string;
  description?: string;
  severity_level: number;
  created_at: Date;
}

export interface Exploit {
  id: string;
  cve_id?: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  cvss_score?: number;
  category_id?: string;
  chromeos_version_id: string;
  discovered_date?: Date;
  disclosed_date?: Date;
  patched_date?: Date;
  exploit_code?: string;
  proof_of_concept?: string;
  references?: any;
  tags?: string[];
  is_verified: boolean;
  is_public: boolean;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserReport {
  id: string;
  user_id?: string;
  report_type: 'error' | 'false_positive' | 'missing_exploit' | 'suggestion';
  title: string;
  description: string;
  exploit_id?: string;
  chromeos_version_id?: string;
  status: 'pending' | 'reviewing' | 'accepted' | 'rejected';
  ai_analysis?: string;
  admin_notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface ChatSession {
  id: string;
  user_id?: string;
  session_name?: string;
  created_at: Date;
  updated_at: Date;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: any;
  created_at: Date;
}

export interface SystemLog {
  id: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  context?: any;
  created_at: Date;
}

export interface AITrainingData {
  id: string;
  exploit_id: string;
  training_prompt: string;
  ai_response: string;
  model_version?: string;
  confidence_score?: number;
  is_validated: boolean;
  created_at: Date;
}

// API Request/Response types
export interface CreateExploitRequest {
  cve_id?: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  cvss_score?: number;
  category_id?: string;
  chromeos_version_id: string;
  discovered_date?: string;
  disclosed_date?: string;
  patched_date?: string;
  exploit_code?: string;
  proof_of_concept?: string;
  references?: any;
  tags?: string[];
  is_public?: boolean;
}

export interface UpdateExploitRequest extends Partial<CreateExploitRequest> {
  id: string;
  [key: string]: any;
}

export interface CreateUserReportRequest {
  report_type: 'error' | 'false_positive' | 'missing_exploit' | 'suggestion';
  title: string;
  description: string;
  exploit_id?: string;
  chromeos_version_id?: string;
}

export interface ChatRequest {
  message: string;
  session_id?: string;
  context?: any;
}

export interface ChatResponse {
  message: string;
  session_id: string;
  metadata?: any;
}

// ChromeOS specific types
export interface ChromeOSUpdateInfo {
  version: string;
  build_number: string;
  release_date: string;
  security_patches: string[];
  new_features: string[];
  known_issues: string[];
}

export interface VulnerabilityScanResult {
  version: string;
  vulnerabilities_found: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  new_vulnerabilities: string[];
  scan_date: Date;
}

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
