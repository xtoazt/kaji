import axios from 'axios';
import { logger } from '../utils/logger';

export interface AIResponse {
  content: string;
  confidence: number;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ExploitAnalysis {
  vulnerability_type: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  cvss_score: number;
  description: string;
  potential_impact: string;
  mitigation_strategies: string[];
  references: string[];
  confidence: number;
}

export interface ChromeOSVersionInfo {
  version: string;
  build_number: string;
  release_date: string;
  known_vulnerabilities: number;
  security_patches: string[];
  end_of_life: boolean;
}

class AIService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    this.baseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
    
    if (!this.apiKey) {
      throw new Error('OpenRouter API key is required');
    }
  }

  private async makeRequest(
    model: string,
    messages: any[],
    temperature: number = 0.7,
    max_tokens: number = 4000
  ): Promise<AIResponse> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model,
          messages,
          temperature,
          max_tokens,
          stream: false
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://kaji-security.com',
            'X-Title': 'Kaji ChromeOS Security Research'
          }
        }
      );

      const data = response.data as any;
      const choice = data.choices[0];
      return {
        content: choice.message.content,
        confidence: 0.85, // Default confidence, could be enhanced with model-specific logic
        model: data.model,
        usage: data.usage
      };
    } catch (error) {
      logger.error('OpenRouter API request failed', error);
      throw new Error(`AI service request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async analyzeExploit(
    exploitData: string,
    chromeOSVersion: string
  ): Promise<ExploitAnalysis> {
    const prompt = `
You are Kaji, an expert ChromeOS security researcher. Analyze the following exploit data and provide a comprehensive security assessment.

ChromeOS Version: ${chromeOSVersion}
Exploit Data: ${exploitData}

Please provide a detailed analysis in the following JSON format:
{
  "vulnerability_type": "specific vulnerability type",
  "severity": "critical|high|medium|low|info",
  "cvss_score": 0.0-10.0,
  "description": "detailed description of the vulnerability",
  "potential_impact": "what could an attacker achieve",
  "mitigation_strategies": ["strategy1", "strategy2"],
  "references": ["reference1", "reference2"],
  "confidence": 0.0-1.0
}

Focus on:
1. ChromeOS-specific attack vectors
2. Kernel-level vulnerabilities
3. Browser engine exploits
4. Sandbox escape techniques
5. Privilege escalation paths
`;

    const response = await this.makeRequest('openai/gpt-4o', [
      { role: 'system', content: 'You are Kaji, a ChromeOS security expert specializing in vulnerability research.' },
      { role: 'user', content: prompt }
    ], 0.3);

    try {
      const analysis = JSON.parse(response.content);
      return {
        ...analysis,
        confidence: response.confidence
      };
    } catch (error) {
      logger.error('Failed to parse AI analysis response', error);
      throw new Error('Invalid AI response format');
    }
  }

  public async findNewVulnerabilities(
    chromeOSVersion: string,
    existingExploits: string[]
  ): Promise<string[]> {
    const prompt = `
You are Kaji, an AI security researcher specializing in ChromeOS vulnerabilities. 

ChromeOS Version: ${chromeOSVersion}
Existing Exploits: ${existingExploits.join(', ')}

Based on your knowledge of ChromeOS architecture and the existing vulnerabilities, suggest potential new attack vectors that might exist in this version. Consider:

1. Recent ChromeOS changes and new features
2. Kernel vulnerabilities in the underlying Linux kernel
3. Chrome browser engine vulnerabilities
4. Android subsystem vulnerabilities
5. Crostini Linux container vulnerabilities
6. ARC++ (Android Runtime) vulnerabilities
7. Hardware-specific vulnerabilities

Provide 5-10 specific, actionable vulnerability hypotheses with brief explanations of why they might exist in this version.

Format as a JSON array of strings:
["hypothesis1", "hypothesis2", ...]
`;

    const response = await this.makeRequest('openai/gpt-4o', [
      { role: 'system', content: 'You are Kaji, an expert ChromeOS security researcher with deep knowledge of ChromeOS internals.' },
      { role: 'user', content: prompt }
    ], 0.8);

    try {
      return JSON.parse(response.content);
    } catch (error) {
      logger.error('Failed to parse vulnerability hypotheses', error);
      return [];
    }
  }

  public async answerUserQuestion(
    question: string,
    context: any = {}
  ): Promise<string> {
    const systemPrompt = `
You are Kaji, an AI assistant specializing in ChromeOS security research and vulnerability analysis. You have access to a comprehensive database of ChromeOS exploits and vulnerabilities.

Your capabilities include:
- Explaining ChromeOS vulnerabilities and exploits
- Providing security guidance for ChromeOS
- Analyzing potential attack vectors
- Helping with security research
- Answering questions about ChromeOS security architecture

Always provide accurate, helpful, and detailed responses. If you're unsure about something, say so and suggest where the user might find more information.
`;

    const userPrompt = `
User Question: ${question}

Context: ${JSON.stringify(context, null, 2)}

Please provide a comprehensive and helpful response.
`;

    const response = await this.makeRequest('openai/gpt-4o', [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], 0.7);

    return response.content;
  }

  public async validateUserReport(
    report: string,
    exploitId?: string
  ): Promise<{ isValid: boolean; analysis: string; confidence: number }> {
    const prompt = `
You are Kaji, an expert ChromeOS security researcher. A user has submitted a report about a potential error or new vulnerability.

Report: ${report}
${exploitId ? `Related Exploit ID: ${exploitId}` : ''}

Please analyze this report and determine:
1. Is this a valid security concern?
2. Is the information accurate?
3. What is the severity if valid?
4. What actions should be taken?

Respond in JSON format:
{
  "isValid": true/false,
  "analysis": "detailed analysis of the report",
  "confidence": 0.0-1.0,
  "recommendedAction": "action to take"
}
`;

    const response = await this.makeRequest('openai/gpt-4o', [
      { role: 'system', content: 'You are Kaji, a ChromeOS security expert responsible for validating user reports.' },
      { role: 'user', content: prompt }
    ], 0.4);

    try {
      const validation = JSON.parse(response.content);
      return {
        isValid: validation.isValid,
        analysis: validation.analysis,
        confidence: validation.confidence
      };
    } catch (error) {
      logger.error('Failed to parse validation response', error);
      return {
        isValid: false,
        analysis: 'Unable to parse AI validation response',
        confidence: 0.0
      };
    }
  }

  public async updateChromeOSKnowledge(
    version: string,
    newData: any
  ): Promise<string> {
    const prompt = `
You are Kaji, and you need to update your knowledge base about ChromeOS version ${version}.

New data to incorporate: ${JSON.stringify(newData, null, 2)}

Please provide an updated summary of this ChromeOS version including:
1. Key security features
2. Known vulnerabilities
3. Recent patches
4. Security recommendations
5. Areas of concern

This will be used to update the website's knowledge base.
`;

    const response = await this.makeRequest('openai/gpt-4o', [
      { role: 'system', content: 'You are Kaji, maintaining a comprehensive ChromeOS security knowledge base.' },
      { role: 'user', content: prompt }
    ], 0.5);

    return response.content;
  }
}

export const aiService = new AIService();
