export interface RedactionResult {
  text: string;
  redactedCount: number;
  detections: string[];
}

interface SecretPattern {
  name: string;
  regex: RegExp;
  replacement: string;
}

export class SecretRedactor {
  private patterns: SecretPattern[] = [
    // Anthropic API Keys (ordered before generic sk-)
    {
      name: 'Anthropic API Key',
      regex: /sk-ant-[a-zA-Z0-9_\-]{20,}/g,
      replacement: '[REDACTED:ANTHROPIC_KEY]'
    },
    // OpenAI API Keys
    {
      name: 'OpenAI API Key',
      regex: /sk-(?!ant-)[a-zA-Z0-9_\-]{20,}/g,
      replacement: '[REDACTED:OPENAI_KEY]'
    },
    // Google / Firebase API Keys
    {
      name: 'Google API Key',
      regex: /AIzaSy[a-zA-Z0-9_\-]{33}/g,
      replacement: '[REDACTED:GOOGLE_API_KEY]'
    },
    // GitHub Tokens
    {
      name: 'GitHub Token',
      regex: /gh[pousr]_[a-zA-Z0-9]{36,}/g,
      replacement: '[REDACTED:GITHUB_TOKEN]'
    },
    // AWS Access Key
    {
      name: 'AWS Access Key ID',
      regex: /(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g,
      replacement: '[REDACTED:AWS_KEY]'
    },
    // RSA / Private Keys
    {
      name: 'Private Key Block',
      regex: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g,
      replacement: '[REDACTED:PRIVATE_KEY]'
    },
    // Generic JWT tokens
    {
      name: 'JSON Web Token (JWT)',
      regex: /eyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g,
      replacement: '[REDACTED:JWT_TOKEN]'
    },
    // Bearer tokens
    {
      name: 'Bearer Token',
      regex: /Bearer\s+([a-zA-Z0-9_\-\.~]{25,})/gi,
      replacement: 'Bearer [REDACTED:BEARER_TOKEN]'
    },
    // Common Key-Value assignments (e.g. api_key = "...", password: "...")
    {
      name: 'Credential Assignment',
      regex: /(?<=\b(?:password|passwd|secret|api_?key|access_?token|auth_?token|client_?secret)\s*[:=]\s*["'])([^"'\r\n]{6,})(?=["'])/gi,
      replacement: '[REDACTED:CREDENTIAL]'
    }
  ];

  private restrictedFileGlobs = [
    /^\.env(\..+)?$/,
    /.*\.pem$/,
    /.*\.key$/,
    /^id_rsa$/,
    /^id_ed25519$/,
    /.*credentials\.json$/
  ];

  constructor(customPatterns: Array<{ name: string; regex: string; replacement: string }> = []) {
    for (const p of customPatterns) {
      this.patterns.push({
        name: p.name,
        regex: new RegExp(p.regex, 'g'),
        replacement: p.replacement
      });
    }
  }

  isRestrictedFile(filePath: string): boolean {
    const filename = filePath.split(/[/\\]/).pop() || filePath;
    return this.restrictedFileGlobs.some((pattern) => pattern.test(filename));
  }

  redact(input: string): RedactionResult {
    let result = input;
    let totalRedacted = 0;
    const detections: string[] = [];

    for (const pattern of this.patterns) {
      // Reset regex state
      pattern.regex.lastIndex = 0;
      const matches = result.match(pattern.regex);
      if (matches && matches.length > 0) {
        totalRedacted += matches.length;
        detections.push(`${pattern.name} (${matches.length})`);
        result = result.replace(pattern.regex, pattern.replacement);
      }
    }

    return {
      text: result,
      redactedCount: totalRedacted,
      detections
    };
  }
}
