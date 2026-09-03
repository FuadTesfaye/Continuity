import { ContinuityState, ContinuityStateSchema, ProjectInfo } from '../types/state.js';
import { NextAction } from '../types/handover.js';
import { FileSystem } from '../storage/file-system.js';
import { MarkdownHelper } from '../storage/markdown.js';

export class StateManager {
  constructor(private readonly fs: FileSystem) {}

  async getState(): Promise<ContinuityState> {
    const statePath = this.fs.resolveContinuity('state.md');
    if (!this.fs.exists(statePath)) {
      throw new Error(`State file not found at ${statePath}. Run 'continuity init' first.`);
    }

    const content = await this.fs.readFile(statePath);
    return this.parseStateMarkdown(content);
  }

  async saveState(state: Partial<ContinuityState>): Promise<ContinuityState> {
    let current: ContinuityState;
    try {
      current = await this.getState();
    } catch {
      current = {
        project: state.project || 'Untitled Project',
        currentBranch: 'main',
        currentTask: 'No active task',
        status: 'Ready',
        progress: 0,
        completed: [],
        remaining: [],
        currentFiles: [],
        currentBlocker: null,
        lastAction: 'Initialized',
        nextAction: {
          problem: 'No blocker',
          expectedSolution: 'Define task and start development',
          constraints: []
        },
        updatedAt: new Date().toISOString()
      };
    }

    const merged: ContinuityState = {
      ...current,
      ...state,
      updatedAt: new Date().toISOString()
    };

    const validated = ContinuityStateSchema.parse(merged);
    const markdown = this.formatStateMarkdown(validated);
    await this.fs.writeFile(this.fs.resolveContinuity('state.md'), markdown);
    return validated;
  }

  async getProjectInfo(): Promise<ProjectInfo> {
    const projectPath = this.fs.resolveContinuity('project.md');
    if (!this.fs.exists(projectPath)) {
      let fallbackName = '';
      try {
        const statePath = this.fs.resolveContinuity('state.md');
        if (this.fs.exists(statePath)) {
          const raw = await this.fs.readFile(statePath);
          const sections = MarkdownHelper.extractSections(raw);
          fallbackName = sections.get('Project') || '';
        }
      } catch {}

      return {
        name: fallbackName || 'Project',
        purpose: '',
        stack: [],
        architecture: '',
        infrastructure: []
      };
    }

    const raw = await this.fs.readFile(projectPath);
    const sections = MarkdownHelper.extractSections(raw);

    const name = sections.get('Name') || 'Project';
    const purpose = sections.get('Purpose') || '';
    const stack = MarkdownHelper.parseBulletList(sections.get('Stack') || '');
    const architecture = sections.get('Architecture') || '';
    const database = sections.get('Database') || undefined;
    const infrastructure = MarkdownHelper.parseBulletList(sections.get('Infrastructure') || '');
    const repository = sections.get('Repository') || undefined;

    return {
      name,
      purpose,
      stack,
      architecture,
      database,
      infrastructure,
      repository
    };
  }

  async getArchitecture(): Promise<string> {
    const archPath = this.fs.resolveContinuity('architecture.md');
    if (!this.fs.exists(archPath)) return '';
    return this.fs.readFile(archPath);
  }

  private parseStateMarkdown(markdown: string): ContinuityState {
    const sections = MarkdownHelper.extractSections(markdown);

    const project = sections.get('Project') || 'Project';
    const currentBranch = sections.get('Current Branch') || 'main';
    const currentTask = sections.get('Current Task') || 'No active task';
    const status = sections.get('Status') || 'In Progress';
    const progressStr = sections.get('Progress') || '0';
    const progress = parseInt(progressStr.replace(/[^0-9]/g, ''), 10) || 0;

    const completed = MarkdownHelper.parseBulletList(sections.get('Completed') || '');
    const remaining = MarkdownHelper.parseBulletList(sections.get('Remaining') || '');
    const currentFiles = MarkdownHelper.parseBulletList(sections.get('Current Files') || '');

    const rawBlocker = sections.get('Current Blocker');
    const currentBlocker = !rawBlocker || rawBlocker.toLowerCase() === 'none' ? null : rawBlocker;

    const lastAction = sections.get('Last Action') || '';
    const lastSession = sections.get('Last Session') || undefined;
    const lastCommit = sections.get('Last Commit') || undefined;

    const nextActionRaw = sections.get('Next Action') || '';
    let nextAction: NextAction;

    if (typeof nextActionRaw === 'string') {
      const fileMatch = nextActionRaw.match(/Open:\s*([^\n]+)/);
      const focusMatch = nextActionRaw.match(/Focus:\s*([^\n]+)/);
      const problemMatch = nextActionRaw.match(/Problem:\s*([^\n]+)/);
      const solutionMatch = nextActionRaw.match(/Expected solution:\s*([^\n]+)/i) || nextActionRaw.match(/Solution:\s*([^\n]+)/i);

      nextAction = {
        file: fileMatch ? fileMatch[1].trim() : undefined,
        focus: focusMatch ? focusMatch[1].trim() : undefined,
        problem: problemMatch ? problemMatch[1].trim() : nextActionRaw.trim() || 'Continue current task',
        expectedSolution: solutionMatch ? solutionMatch[1].trim() : 'Proceed with implementation',
        constraints: MarkdownHelper.parseBulletList(nextActionRaw)
      };
    } else {
      nextAction = nextActionRaw;
    }

    return {
      project,
      currentBranch,
      currentTask,
      status,
      progress,
      completed,
      remaining,
      currentFiles,
      currentBlocker,
      lastAction,
      nextAction,
      lastSession,
      lastCommit,
      updatedAt: new Date().toISOString()
    };
  }

  private formatStateMarkdown(state: ContinuityState): string {
    let nextActionBlock = '';
    if (typeof state.nextAction === 'string') {
      nextActionBlock = state.nextAction;
    } else {
      const parts: string[] = [];
      if (state.nextAction.file) parts.push(`Open:\n${state.nextAction.file}`);
      if (state.nextAction.focus) parts.push(`Focus:\n${state.nextAction.focus}`);
      parts.push(`Problem:\n${state.nextAction.problem}`);
      parts.push(`Expected solution:\n${state.nextAction.expectedSolution}`);
      if (state.nextAction.constraints && state.nextAction.constraints.length > 0) {
        parts.push(`Constraints:\n${MarkdownHelper.formatBulletList(state.nextAction.constraints)}`);
      }
      nextActionBlock = parts.join('\n\n');
    }

    return `# Current State

## Project
${state.project}

## Current Branch
${state.currentBranch}

## Current Task
${state.currentTask}

## Status
${state.status}

## Progress
${state.progress}%

## Completed
${MarkdownHelper.formatBulletList(state.completed, '✓')}

## Remaining
${MarkdownHelper.formatBulletList(state.remaining, '□')}

## Current Files
${MarkdownHelper.formatBulletList(state.currentFiles)}

## Current Blocker
${state.currentBlocker || 'None'}

## Last Action
${state.lastAction}

## Next Action
${nextActionBlock}

## Last Session
${state.lastSession || 'None'}

## Last Commit
${state.lastCommit || 'None'}
`;
  }
}
