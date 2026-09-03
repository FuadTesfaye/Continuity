import path from 'node:path';
import { Decision, DecisionSchema } from '../types/decision.js';
import { FileSystem } from '../storage/file-system.js';
import { MarkdownHelper } from '../storage/markdown.js';

export class DecisionManager {
  constructor(private readonly fs: FileSystem) {}

  private get decisionsDir(): string {
    return this.fs.resolveContinuity('decisions');
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 40);
  }

  async getNextAdrId(): Promise<string> {
    await this.fs.ensureDir(this.decisionsDir);
    const files = await this.fs.listFiles(this.decisionsDir, '.md');
    let maxId = 0;

    for (const file of files) {
      const filename = path.basename(file);
      const match = filename.match(/ADR-(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxId) maxId = num;
      }
    }

    const nextNum = maxId + 1;
    return `ADR-${nextNum.toString().padStart(3, '0')}`;
  }

  async recordDecision(data: {
    title: string;
    decision: string;
    why: string;
    alternatives?: string[];
    rejectedBecause?: string;
    author?: string;
  }): Promise<Decision> {
    await this.fs.ensureDir(this.decisionsDir);
    const id = await this.getNextAdrId();
    const date = new Date().toISOString().split('T')[0];
    const slug = this.slugify(data.title);
    const filename = `${id}-${slug}.md`;
    const filePath = path.join(this.decisionsDir, filename);

    const decision: Decision = {
      id,
      title: data.title,
      status: 'accepted',
      date,
      decision: data.decision,
      why: data.why,
      alternatives: data.alternatives || [],
      rejectedBecause: data.rejectedBecause,
      implications: [],
      author: data.author || 'developer'
    };

    const validated = DecisionSchema.parse(decision);
    const markdown = this.formatDecisionMarkdown(validated);
    await this.fs.writeFile(filePath, markdown);

    return validated;
  }

  async listDecisions(): Promise<Decision[]> {
    if (!this.fs.exists(this.decisionsDir)) return [];
    const files = await this.fs.listFiles(this.decisionsDir, '.md');
    const decisions: Decision[] = [];

    for (const file of files) {
      const raw = await this.fs.readFile(file);
      const decision = this.parseDecisionMarkdown(raw, path.basename(file, '.md'));
      if (decision) decisions.push(decision);
    }

    return decisions.sort((a, b) => a.id.localeCompare(b.id));
  }

  async getDecision(id: string): Promise<Decision | undefined> {
    const decisions = await this.listDecisions();
    return decisions.find((d) => d.id.toLowerCase() === id.toLowerCase() || d.title.toLowerCase().includes(id.toLowerCase()));
  }

  private formatDecisionMarkdown(d: Decision): string {
    const frontmatter = {
      id: d.id,
      title: d.title,
      status: d.status,
      date: d.date,
      author: d.author
    };

    const body = `# ${d.id}: ${d.title}

## Decision
${d.decision}

## Why
${d.why}

## Alternatives
${MarkdownHelper.formatBulletList(d.alternatives)}

## Rejected Because
${d.rejectedBecause || 'None specified.'}

## Date
${d.date}
`;

    return MarkdownHelper.stringify(body, frontmatter);
  }

  private parseDecisionMarkdown(raw: string, fallbackId: string): Decision | undefined {
    try {
      const parsed = MarkdownHelper.parse<any>(raw);
      const sections = MarkdownHelper.extractSections(parsed.content);

      const id = parsed.data.id || fallbackId.split('-')[0];
      const title = parsed.data.title || sections.get('Decision') || fallbackId;
      const date = parsed.data.date || sections.get('Date') || new Date().toISOString().split('T')[0];

      return {
        id,
        title,
        status: parsed.data.status || 'accepted',
        date,
        decision: sections.get('Decision') || '',
        why: sections.get('Why') || '',
        alternatives: parsed.data.alternatives || MarkdownHelper.parseBulletList(sections.get('Alternatives') || ''),
        rejectedBecause: sections.get('Rejected Because'),
        implications: parsed.data.implications || [],
        author: parsed.data.author
      };
    } catch {
      return undefined;
    }
  }
}
