import { StateManager } from './state-manager.js';
import { HandoverManager } from './handover-manager.js';
import { SessionManager } from './session-manager.js';
import { FailureManager } from './failure-manager.js';
import { DecisionManager } from './decision-manager.js';
import { GitClient } from '../git/git-client.js';
import { MarkdownHelper } from '../storage/markdown.js';

export interface ResumeContext {
  project: string;
  purpose: string;
  architectureSummary: string;
  branch: string;
  commit?: string;
  currentTask: string;
  progress: number;
  completed: string[];
  remaining: string[];
  currentBlocker?: string | null;
  relevantFiles: string[];
  previousFailedApproaches: string[];
  recentDecisions: string[];
  lastSession?: string;
  nextAction: {
    file?: string;
    focus?: string;
    problem: string;
    expectedSolution: string;
    constraints: string[];
  };
  hasUncommittedChanges: boolean;
}

export class ResumeEngine {
  constructor(
    private readonly stateManager: StateManager,
    private readonly handoverManager: HandoverManager,
    private readonly sessionManager: SessionManager,
    private readonly failureManager: FailureManager,
    private readonly decisionManager: DecisionManager,
    private readonly git: GitClient
  ) {}

  async buildContext(): Promise<ResumeContext> {
    const projectInfo = await this.stateManager.getProjectInfo();
    const state = await this.stateManager.getState();
    const gitStatus = await this.git.getStatus();
    const latestHandover = await this.handoverManager.getLatestHandover();
    const latestSession = await this.sessionManager.getLatestSession();
    const failures = await this.failureManager.listFailures();
    const decisions = await this.decisionManager.listDecisions();

    // Determine next action from handover or state
    let nextAction = latestHandover?.nextAction || (typeof state.nextAction === 'object' ? state.nextAction : {
      problem: state.nextAction || 'Continue work',
      expectedSolution: 'Proceed to next task milestone',
      constraints: []
    });

    const relevantFiles = Array.from(
      new Set([
        ...state.currentFiles,
        ...(latestHandover?.modifiedFiles || []),
        ...gitStatus.modifiedFiles,
        ...(nextAction.file ? [nextAction.file] : [])
      ])
    ).slice(0, 10);

    const previousFailedApproaches = [
      ...(latestHandover?.failedApproaches || []),
      ...failures.map((f) => `[${f.title}]: ${f.doNotRepeat} -> ${f.betterApproach}`)
    ].slice(0, 3);

    const recentDecisions = [
      ...(latestHandover?.decisions || []),
      ...decisions.slice(-3).map((d) => `${d.id} (${d.title}): ${d.decision}`)
    ].slice(0, 3);

    return {
      project: projectInfo.name || state.project,
      purpose: projectInfo.purpose || '',
      architectureSummary: projectInfo.architecture || (projectInfo.stack.length > 0 ? projectInfo.stack.join(', ') : 'Standard'),
      branch: gitStatus.branch || state.currentBranch,
      commit: gitStatus.commit?.shortHash || state.lastCommit,
      currentTask: state.currentTask,
      progress: state.progress,
      completed: state.completed,
      remaining: state.remaining,
      currentBlocker: state.currentBlocker,
      relevantFiles,
      previousFailedApproaches,
      recentDecisions,
      lastSession: latestSession?.id || state.lastSession,
      nextAction,
      hasUncommittedChanges: gitStatus.hasUncommittedChanges
    };
  }

  formatCompact(ctx: ResumeContext): string {
    const lines: string[] = [
      '================ CONTINUITY RESUME ================\n',
      `Project: ${ctx.project}`,
      `Branch: ${ctx.branch}${ctx.commit ? ` (${ctx.commit})` : ''}`,
      `Current Task: ${ctx.currentTask} [${ctx.progress}% completed]`,
      `Status: ${ctx.currentBlocker ? `BLOCKED - ${ctx.currentBlocker}` : 'In Progress'}`,
      `Uncommitted Changes: ${ctx.hasUncommittedChanges ? 'YES (check git status)' : 'None'}\n`,
      '--- LAST COMPLETED ---',
      ctx.completed.length > 0 ? ctx.completed.slice(-3).map((c) => `✓ ${c}`).join('\n') : 'None recorded',
      '\n--- WORK REMAINING ---',
      ctx.remaining.length > 0 ? ctx.remaining.slice(0, 4).map((r) => `□ ${r}`).join('\n') : 'None recorded',
      '\n--- RELEVANT FILES ---',
      ctx.relevantFiles.length > 0 ? ctx.relevantFiles.map((f) => `- ${f}`).join('\n') : 'None',
      '\n--- DO NOT REPEAT (FAILED APPROACHES) ---',
      ctx.previousFailedApproaches.length > 0
        ? ctx.previousFailedApproaches.map((f) => `! ${f}`).join('\n')
        : 'None recorded',
      '\n--- RECOMMENDED NEXT ACTION ---',
      ctx.nextAction.file ? `Open: ${ctx.nextAction.file}` : '',
      ctx.nextAction.focus ? `Focus: ${ctx.nextAction.focus}` : '',
      `Problem: ${ctx.nextAction.problem}`,
      `Expected Solution: ${ctx.nextAction.expectedSolution}`,
      ctx.nextAction.constraints && ctx.nextAction.constraints.length > 0
        ? `Constraints:\n${ctx.nextAction.constraints.map((c) => `  * ${c}`).join('\n')}`
        : '',
      '\n===================================================='
    ];

    return lines.filter((l) => l !== '').join('\n');
  }

  formatFullMarkdown(ctx: ResumeContext): string {
    return `# Continuity Resume Context

## 1. Project Identity
- **Name**: ${ctx.project}
- **Purpose**: ${ctx.purpose || 'Not specified'}
- **Architecture**: ${ctx.architectureSummary}
- **Branch**: \`${ctx.branch}\`
- **Commit**: \`${ctx.commit || 'unknown'}\`
- **Uncommitted Changes**: ${ctx.hasUncommittedChanges ? 'Yes' : 'No'}

## 2. Current Task & Progress
- **Task**: ${ctx.currentTask}
- **Progress**: ${ctx.progress}%
- **Blocker**: ${ctx.currentBlocker || 'None'}

### Completed
${MarkdownHelper.formatBulletList(ctx.completed, '✓')}

### Remaining
${MarkdownHelper.formatBulletList(ctx.remaining, '□')}

## 3. Relevant Source Files
${MarkdownHelper.formatBulletList(ctx.relevantFiles)}

## 4. Architectural Constraints & Key Decisions
${MarkdownHelper.formatBulletList(ctx.recentDecisions)}

## 5. Failed Approaches ("Do Not Repeat")
${MarkdownHelper.formatBulletList(ctx.previousFailedApproaches, '⚠️')}

## 6. Recommended Next Action
${ctx.nextAction.file ? `- **Open**: \`${ctx.nextAction.file}\`` : ''}
${ctx.nextAction.focus ? `- **Focus**: \`${ctx.nextAction.focus}\`` : ''}
- **Problem**: ${ctx.nextAction.problem}
- **Expected Solution**: ${ctx.nextAction.expectedSolution}
${ctx.nextAction.constraints.length > 0 ? `- **Constraints**:\n${MarkdownHelper.formatBulletList(ctx.nextAction.constraints, '  *')}` : ''}
`;
  }
}
