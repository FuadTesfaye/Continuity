import { describe, it, expect } from 'vitest';
import { SecretRedactor } from '../../src/core/security/redactor.js';

describe('SecretRedactor', () => {
  const redactor = new SecretRedactor();

  it('redacts OpenAI API keys', () => {
    const input = 'My key is sk-abcdef1234567890abcdef1234567890 and should be hidden';
    const res = redactor.redact(input);
    expect(res.text).toContain('[REDACTED:OPENAI_KEY]');
    expect(res.text).not.toContain('sk-abcdef1234567890');
    expect(res.redactedCount).toBe(1);
  });

  it('redacts Anthropic API keys', () => {
    const input = 'Use sk-ant-api03-abcdef1234567890abcdef for requests';
    const res = redactor.redact(input);
    expect(res.text).toContain('[REDACTED:ANTHROPIC_KEY]');
    expect(res.text).not.toContain('sk-ant-');
  });

  it('redacts Google API keys', () => {
    const input = 'apiKey: AIzaSyD1234567890abcdefghijklmnopqrstuvw';
    const res = redactor.redact(input);
    expect(res.text).toContain('[REDACTED:GOOGLE_API_KEY]');
  });

  it('redacts GitHub Personal Access Tokens', () => {
    const input = 'Token is ghp_1234567890abcdefghijklmnopqrstuvwxyzAB';
    const res = redactor.redact(input);
    expect(res.text).toContain('[REDACTED:GITHUB_TOKEN]');
  });

  it('redacts Bearer tokens', () => {
    const input = 'Authorization: Bearer mySecretAccessTokenValue123456789';
    const res = redactor.redact(input);
    expect(res.text).toContain('Bearer [REDACTED:BEARER_TOKEN]');
  });

  it('identifies restricted files', () => {
    expect(redactor.isRestrictedFile('.env')).toBe(true);
    expect(redactor.isRestrictedFile('.env.production')).toBe(true);
    expect(redactor.isRestrictedFile('cert.pem')).toBe(true);
    expect(redactor.isRestrictedFile('server.key')).toBe(true);
    expect(redactor.isRestrictedFile('id_rsa')).toBe(true);
    expect(redactor.isRestrictedFile('src/auth.ts')).toBe(false);
  });
});
