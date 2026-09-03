import path from 'node:path';
import { SessionSummary, SessionSummarySchema } from '../types/session.js';
import { FileSystem } from '../storage/file-system.js';
import { MarkdownHelper } from '../storage/markdown.js';
import { SecretRedactor } from '../security/redactor.js';
import { StateManager } from './state-manager.js';

export class SessionManager {
  private redactor: SecretRedactor;

  constructor(
    private readonly fs: FileSystem,
    private readonly stateManager: StateManager
  ) {
    this.redactor = new SecretRedactor();
  }

  private get sessionsDir(): string {
    return this.fs.resolveContinuity('sessions');
  }

  private getDateParts(d = new Date()): { year: string; month: string; day: string; dateStr: string; timeStr: string } {
    const year = d.getFullYear().toString();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const hours = d.getHours().toString().padStart(2, '0');
    const mins = d.getMinutes().toString().padStart(2, '0');
    return {
      year,
      month,
      day,
      dateStr: `${year}-${month}-${day}`,
      timeStr: `${hours}${mins}`
    };
  }

  async saveSession(
    data: {
      agent?: string;
      branch?: string;
      task?: string;
      objective: string;
      workCompleted?: string[];
      filesChanged?: string[];
      decisions?: string[];
      failedApproaches?: string[];
      problems?: string[];
      nextStep?: string;
      importantContext?: string;
      gitCommit?: string;
    },
    rawContent?: string
  ): Promise<SessionSummary> {
    const dateInfo = this.getDateParts();
    const id = `sess_${dateInfo.dateStr.replace(/-/g, '')}_${dateInfo.timeStr}`;

    const summaryDir = path.join(this.sessionsDir, 'summaries', dateInfo.year, dateInfo.month, dateInfo.day);
    const rawDir = path.join(this.sessionsDir, 'raw', dateInfo.year, dateInfo.month, dateInfo.day);
    await this.fs.ensureDir(summaryDir);

    // Apply security redaction to text fields
    const sanitizedObjective = this.redactor.redact(data.objective).text;
    const sanitizedCompleted = (data.workCompleted || []).map((w) => this.redactor.redact(w).text);
    const sanitizedDecisions = (data.decisions || []).map((d) => this.redactor.redact(d).text);
    const sanitizedFailures = (data.failedApproaches || []).map((f) => this.redactor.redact(f).text);
    const sanitizedProblems = (data.problems || []).map((p) => this.redactor.redact(p).text);
    const sanitizedNextStep = data.nextStep ? this.redactor.redact(data.nextStep).text : undefined;
    const sanitizedContext = data.importantContext ? this.redactor.redact(data.importantContext).text : undefined;

    const summary: SessionSummary = {
      id,
      date: dateInfo.dateStr,
      agent: data.agent || 'ai',
      branch: data.branch || 'main',
      task: data.task,
      objective: sanitizedObjective,
      workCompleted: sanitizedCompleted,
      filesChanged: data.filesChanged || [],
      decisions: sanitizedDecisions,
      failedApproaches: sanitizedFailures,
      problems: sanitizedProblems,
      nextStep: sanitizedNextStep,
      importantContext: sanitizedContext,
      gitCommit: data.gitCommit
    };

    const validated = SessionSummarySchema.parse(summary);
    const markdown = this.formatSessionMarkdown(validated);
    const summaryFilePath = path.join(summaryDir, `${id}.md`);
    await this.fs.writeFile(summaryFilePath, markdown);

    // If raw session content was provided, save to raw/ with redaction
    if (rawContent) {
      await this.fs.ensureDir(rawDir);
      const sanitizedRaw = this.redactor.redact(rawContent).text;
      const rawFilePath = path.join(rawDir, `${id}-raw.md`);
      await this.fs.writeFile(rawFilePath, sanitizedRaw);
    }

    // Sync with state.md
    await this.stateManager.saveState({
      lastSession: `${validated.date} (${validated.id})`,
      lastCommit: validated.gitCommit || undefined,
      lastAction: `Session finished: ${validated.objective}`
    });

    return validated;
  }

  async listSessions(): Promise<SessionSummary[]> {
    const summariesRoot = path.join(this.sessionsDir, 'summaries');
    if (!this.fs.exists(summariesRoot)) return [];

    const files = await this.fs.listFiles(summariesRoot, '.md');
    const sessions: SessionSummary[] = [];

    for (const file of files) {
      const raw = await this.fs.readFile(file);
      const sess = this.parseSessionMarkdown(raw, path.basename(file, '.md'));
      if (sess) sessions.push(sess);
    }

    return sessions.sort((a, b) => b.id.localeCompare(a.id));
  }

  async getLatestSession(): Promise<SessionSummary | undefined> {
    const list = await this.listSessions();
    return list[0];
  }

  private formatSessionMarkdown(s: SessionSummary): string {
    const frontmatter = {
      id: s.id,
      date: s.date,
      agent: s.agent,
      branch: s.branch,
      task: s.task,
      gitCommit: s.gitCommit
    };

    const body = `# Session Summary

## Objective
${s.objective}

## Work Completed
${MarkdownHelper.formatBulletList(s.workCompleted)}

## Files Changed
${MarkdownHelper.formatBulletList(s.filesChanged)}

## Decisions
${MarkdownHelper.formatBulletList(s.decisions)}

## Failed Approaches
${MarkdownHelper.formatBulletList(s.failedApproaches)}

## Problems
${MarkdownHelper.formatBulletList(s.problems)}

## Next Step
${s.nextStep || 'None specified.'}

## Important Context
${s.importantContext || 'None.'}

## Git
Commit: ${s.gitCommit || 'None'}
`;

    return MarkdownHelper.stringify(body, frontmatter);
  }

  private parseSessionMarkdown(raw: string, fallbackId: string): SessionSummary | undefined {
    try {
      const parsed = MarkdownHelper.parse<any>(raw);
      const sections = MarkdownHelper.extractSections(parsed.content);

      return {
        id: parsed.data.id || fallbackId,
        date: parsed.data.date || new Date().toISOString().split('T')[0],
        agent: parsed.data.agent || 'ai',
        branch: parsed.data.branch || 'main',
        task: parsed.data.task,
        objective: sections.get('Objective') || '',
        workCompleted: MarkdownHelper.parseBulletList(sections.get('Work Completed') || ''),
        filesChanged: MarkdownHelper.parseBulletList(sections.get('Files Changed') || ''),
        decisions: MarkdownHelper.parseBulletList(sections.get('Decisions') || ''),
        failedApproaches: MarkdownHelper.parseBulletList(sections.get('Failed Approaches') || ''),
        problems: MarkdownHelper.parseBulletList(sections.get('Problems') || ''),
        nextStep: sections.get('Next Step'),
        importantContext: sections.get('Important Context'),
        gitCommit: parsed.data.gitCommit || sections.get('Git')?.replace(/^Commit:\s*/i, '').trim()
      };
    } catch {
      return undefined;
    }
  }
}
