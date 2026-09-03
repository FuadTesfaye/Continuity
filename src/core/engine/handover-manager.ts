import path from 'node:path';
import { Handover, HandoverSchema, NextAction } from '../types/handover.js';
import { FileSystem } from '../storage/file-system.js';
import { MarkdownHelper } from '../storage/markdown.js';
import { GitClient } from '../git/git-client.js';
import { StateManager } from './state-manager.js';
import { DecisionManager } from './decision-manager.js';
import { FailureManager } from './failure-manager.js';
import { SecretRedactor } from '../security/redactor.js';

export class HandoverManager {
  private redactor: SecretRedactor;

  constructor(
    private readonly fs: FileSystem,
    private readonly git: GitClient,
    private readonly stateManager: StateManager,
    private readonly decisionManager: DecisionManager,
    private readonly failureManager: FailureManager
  ) {
    this.redactor = new SecretRedactor();
  }

  private get handoversDir(): string {
    return this.fs.resolveContinuity('handovers');
  }

  async createHandover(data: {
    currentTask?: string;
    progress?: number;
    completed?: string[];
    remaining?: string[];
    problems?: string[];
    decisions?: string[];
    failedApproaches?: string[];
    nextAction: NextAction;
    author?: string;
  }): Promise<Handover> {
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const timeStr = `${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;

    const projectInfo = await this.stateManager.getProjectInfo();
    const currentState = await this.stateManager.getState();
    const gitStatus = await this.git.getStatus();

    const taskSlug = (data.currentTask || currentState.currentTask)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 30);

    const id = `handover_${year}${month}${day}_${timeStr}_${taskSlug}`;
    const targetDir = path.join(this.handoversDir, year, month);
    await this.fs.ensureDir(targetDir);

    // Modified files from git + current files in state
    const modifiedFiles = Array.from(
      new Set([
        ...gitStatus.modifiedFiles,
        ...gitStatus.stagedFiles,
        ...currentState.currentFiles,
        ...(data.nextAction.file ? [data.nextAction.file] : [])
      ])
    );

    // Pull recent ADR titles or passed decisions
    let decisions = data.decisions || [];
    if (decisions.length === 0) {
      const adrs = await this.decisionManager.listDecisions();
      decisions = adrs.slice(-3).map((a) => `${a.id}: ${a.title} - ${a.decision}`);
    }

    // Pull recent failures if not passed
    let failedApproaches = data.failedApproaches || [];
    if (failedApproaches.length === 0) {
      const failures = await this.failureManager.listFailures();
      failedApproaches = failures.slice(0, 3).map((f) => `${f.title}: ${f.doNotRepeat}`);
    }

    // Redact sensitive inputs
    const sanitizedNextAction: NextAction = {
      file: data.nextAction.file,
      focus: data.nextAction.focus,
      problem: this.redactor.redact(data.nextAction.problem).text,
      expectedSolution: this.redactor.redact(data.nextAction.expectedSolution).text,
      constraints: (data.nextAction.constraints || []).map((c) => this.redactor.redact(c).text)
    };

    const handover: Handover = {
      id,
      date: `${year}-${month}-${day} ${timeStr.slice(0, 2)}:${timeStr.slice(2, 4)}`,
      project: projectInfo.name || currentState.project,
      branch: gitStatus.branch || currentState.currentBranch,
      commit: gitStatus.commit?.shortHash || currentState.lastCommit,
      currentTask: data.currentTask || currentState.currentTask,
      progress: data.progress !== undefined ? data.progress : currentState.progress,
      completed: data.completed || currentState.completed,
      remaining: data.remaining || currentState.remaining,
      modifiedFiles,
      uncommittedChanges: gitStatus.hasUncommittedChanges,
      decisions,
      problems: data.problems || (currentState.currentBlocker ? [currentState.currentBlocker] : []),
      failedApproaches,
      nextAction: sanitizedNextAction,
      author: data.author || 'ai'
    };

    const validated = HandoverSchema.parse(handover);
    const markdown = this.formatHandoverMarkdown(validated);
    const filePath = path.join(targetDir, `${id}.md`);
    await this.fs.writeFile(filePath, markdown);

    // Sync back to state.md
    await this.stateManager.saveState({
      currentBranch: validated.branch,
      currentTask: validated.currentTask,
      progress: validated.progress,
      status: `In progress — ${validated.progress}%`,
      completed: validated.completed,
      remaining: validated.remaining,
      currentFiles: validated.modifiedFiles,
      currentBlocker: validated.problems.length > 0 ? validated.problems[0] : null,
      lastAction: `Handover created (${validated.id})`,
      nextAction: validated.nextAction,
      lastCommit: validated.commit
    });

    return validated;
  }

  async getLatestHandover(): Promise<Handover | undefined> {
    if (!this.fs.exists(this.handoversDir)) return undefined;
    const files = await this.fs.listFiles(this.handoversDir, '.md');
    if (files.length === 0) return undefined;

    // Sort descending by filename
    files.sort((a, b) => path.basename(b).localeCompare(path.basename(a)));
    const raw = await this.fs.readFile(files[0]);
    return this.parseHandoverMarkdown(raw, path.basename(files[0], '.md'));
  }

  private formatHandoverMarkdown(h: Handover): string {
    const frontmatter = {
      id: h.id,
      date: h.date,
      project: h.project,
      branch: h.branch,
      commit: h.commit,
      task: h.currentTask,
      progress: h.progress
    };

    const nextActionLines: string[] = [];
    if (h.nextAction.file) nextActionLines.push(`Open:\n\`${h.nextAction.file}\``);
    if (h.nextAction.focus) nextActionLines.push(`Focus:\n\`${h.nextAction.focus}\``);
    nextActionLines.push(`Problem:\n${h.nextAction.problem}`);
    nextActionLines.push(`Expected Solution:\n${h.nextAction.expectedSolution}`);
    if (h.nextAction.constraints.length > 0) {
      nextActionLines.push(`Constraints:\n${MarkdownHelper.formatBulletList(h.nextAction.constraints)}`);
    }

    const body = `# Continuity Handover: ${h.currentTask}

## Project State
- **Project**: ${h.project}
- **Branch**: \`${h.branch}\`
- **Commit**: \`${h.commit || 'uncommitted'}\`
- **Uncommitted Changes**: ${h.uncommittedChanges ? 'Yes (inspect git status)' : 'Clean'}

## Current Task & Progress
- **Task**: ${h.currentTask}
- **Progress**: ${h.progress}%

### Completed
${MarkdownHelper.formatBulletList(h.completed, '✓')}

### Remaining
${MarkdownHelper.formatBulletList(h.remaining, '□')}

## Modified Files
${MarkdownHelper.formatBulletList(h.modifiedFiles)}

## Important Decisions
${MarkdownHelper.formatBulletList(h.decisions)}

## Known Problems & Blockers
${MarkdownHelper.formatBulletList(h.problems)}

## Failed Approaches (Do Not Repeat)
${MarkdownHelper.formatBulletList(h.failedApproaches)}

## Next Action
${nextActionLines.join('\n\n')}
`;

    return MarkdownHelper.stringify(body, frontmatter);
  }

  private parseHandoverMarkdown(raw: string, fallbackId: string): Handover | undefined {
    try {
      const parsed = MarkdownHelper.parse<any>(raw);
      const sections = MarkdownHelper.extractSections(parsed.content);

      const nextActionRaw = sections.get('Next Action') || '';
      const fileMatch = nextActionRaw.match(/Open:\s*`?([^`\n]+)`?/);
      const focusMatch = nextActionRaw.match(/Focus:\s*`?([^`\n]+)`?/);
      const problemMatch = nextActionRaw.match(/Problem:\s*([^\n]+)/);
      const solMatch = nextActionRaw.match(/Expected Solution:\s*([^\n]+)/i);

      return {
        id: parsed.data.id || fallbackId,
        date: parsed.data.date || new Date().toISOString(),
        project: parsed.data.project || 'Project',
        branch: parsed.data.branch || 'main',
        commit: parsed.data.commit,
        currentTask: parsed.data.task || 'Task',
        progress: typeof parsed.data.progress === 'number' ? parsed.data.progress : 0,
        completed: MarkdownHelper.parseBulletList(sections.get('Completed') || ''),
        remaining: MarkdownHelper.parseBulletList(sections.get('Remaining') || ''),
        modifiedFiles: MarkdownHelper.parseBulletList(sections.get('Modified Files') || ''),
        uncommittedChanges: false,
        decisions: MarkdownHelper.parseBulletList(sections.get('Important Decisions') || ''),
        problems: MarkdownHelper.parseBulletList(sections.get('Known Problems & Blockers') || ''),
        failedApproaches: MarkdownHelper.parseBulletList(sections.get('Failed Approaches (Do Not Repeat)') || ''),
        nextAction: {
          file: fileMatch ? fileMatch[1].trim() : undefined,
          focus: focusMatch ? focusMatch[1].trim() : undefined,
          problem: problemMatch ? problemMatch[1].trim() : nextActionRaw,
          expectedSolution: solMatch ? solMatch[1].trim() : 'Continue implementation',
          constraints: MarkdownHelper.parseBulletList(nextActionRaw)
        },
        author: 'ai'
      };
    } catch {
      return undefined;
    }
  }
}
