import { StateManager } from './state-manager.js';
import { HandoverManager } from './handover-manager.js';
import { SessionManager } from './session-manager.js';
import { FailureManager } from './failure-manager.js';
import { DecisionManager } from './decision-manager.js';
import { PlanManager } from './plan-manager.js';
import { GitClient, GitCommitInfo } from '../git/git-client.js';
import { Plan } from '../types/plan.js';
import { MarkdownHelper } from '../storage/markdown.js';
import { GlobalFileSystem } from '../global/global-file-system.js';
import { ToolchainManager } from '../global/toolchain-manager.js';
import { ProjectRegistryManager } from '../global/project-registry.js';
import { AccountManager } from '../global/account-manager.js';
import { ContextScope } from '../types/global.js';

export interface ResumeContext {
  scope: ContextScope;
  project: string;
  category?: string;
  purpose: string;
  architectureSummary: string;
  developer?: {
    name: string;
    preferences?: string;
  };
  environment?: {
    os: string;
    runtime: string;
    packageManager: string;
  };
  accountMetadata?: {
    provider: string;
    profile: string;
    username: string;
  };
  branch: string;
  commit?: string;
  currentTask: string;
  progress: number;
  plan?: {
    id: string;
    title: string;
    status: string;
    goal: string;
    currentStep?: string;
    nextStep?: string;
    progressPercentage: number;
    steps: Array<{ id: string; description: string; status: string }>;
    constraints: string[];
  };
  completed: string[];
  remaining: string[];
  currentBlocker?: string | null;
  relevantFiles: string[];
  recentCommits: GitCommitInfo[];
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
  uncommittedStats?: {
    filesChanged: number;
    insertions: number;
    deletions: number;
  };
}

export class ResumeEngine {
  constructor(
    private readonly stateManager: StateManager,
    private readonly handoverManager: HandoverManager,
    private readonly sessionManager: SessionManager,
    private readonly failureManager: FailureManager,
    private readonly decisionManager: DecisionManager,
    private readonly git: GitClient,
    private readonly planManager?: PlanManager,
    private readonly globalFs?: GlobalFileSystem
  ) {}

  async buildContext(options: { scope?: ContextScope } = {}): Promise<ResumeContext> {
    const scope = options.scope || 'project';
    const projectInfo = await this.stateManager.getProjectInfo();
    const state = await this.stateManager.getState();
    const gitStatus = await this.git.getStatus();
    const latestHandover = await this.handoverManager.getLatestHandover();
    const latestSession = await this.sessionManager.getLatestSession();
    const failures = await this.failureManager.listFailures();
    const decisions = await this.decisionManager.listDecisions();
    const activePlan = this.planManager ? await this.planManager.getActivePlan() : undefined;

    // Resolve Global Memory if enabled and scope permits
    let developerInfo: ResumeContext['developer'] | undefined;
    let environmentInfo: ResumeContext['environment'] | undefined;
    let category: string | undefined;
    let accountMetadata: ResumeContext['accountMetadata'] | undefined;

    if (this.globalFs && scope !== 'task') {
      try {
        const projectFs = this.stateManager.fs;
        const toolchainMgr = new ToolchainManager(this.globalFs, projectFs);
        const effective = await toolchainMgr.resolveEffectiveToolchain();
        environmentInfo = {
          os: process.platform,
          runtime: `${effective.runtime.name} ${effective.runtime.version} (${effective.runtime.source})`,
          packageManager: `${effective.packageManager.name} (${effective.packageManager.source})`
        };

        const regMgr = new ProjectRegistryManager(this.globalFs);
        const regProject = await regMgr.getProject(projectFs.rootDir || process.cwd());
        if (regProject) {
          category = regProject.type;
        }

        const acctMgr = new AccountManager(this.globalFs);
        const accounts = await acctMgr.listAccounts('github');
        if (accounts.length > 0) {
          accountMetadata = acctMgr.getAiSafeMetadata(accounts[0]);
        }

        if (scope === 'developer' || scope === 'global') {
          const devProfilePath = this.globalFs.resolve('profile', 'developer.md');
          if (this.globalFs.exists(devProfilePath)) {
            const rawDev = await this.globalFs.readFile(devProfilePath);
            const nameMatch = rawDev.match(/Name:\s*([^\n]+)/i);
            developerInfo = {
              name: nameMatch ? nameMatch[1].trim() : 'Developer'
            };
          }
        }
      } catch {}
    }

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
        ...(nextAction.file ? [nextAction.file] : []),
        ...(activePlan ? activePlan.steps.flatMap((s) => s.files) : [])
      ])
    ).slice(0, 10);

    const recentCommits = await this.git.getRecentCommits(5);

    const previousFailedApproaches = [
      ...(latestHandover?.failedApproaches || []),
      ...failures.map((f) => `[${f.title}]: ${f.doNotRepeat} -> ${f.betterApproach}`)
    ].slice(0, 3);

    const recentDecisions = [
      ...(latestHandover?.decisions || []),
      ...decisions.slice(-3).map((d) => `${d.id} (${d.title}): ${d.decision}`)
    ].slice(0, 3);

    let planData: ResumeContext['plan'] | undefined;
    if (activePlan) {
      const completedSteps = activePlan.steps.filter((s) => s.status === 'completed').length;
      const progressPercentage =
        activePlan.steps.length > 0 ? Math.round((completedSteps / activePlan.steps.length) * 100) : 0;
      planData = {
        id: activePlan.id,
        title: activePlan.title,
        status: activePlan.status,
        goal: activePlan.goal,
        currentStep: activePlan.currentStep,
        nextStep: activePlan.nextStep,
        progressPercentage,
        steps: activePlan.steps.map((s) => ({ id: s.id, description: s.description, status: s.status })),
        constraints: activePlan.constraints
      };
    }

    return {
      scope,
      project: projectInfo.name || state.project,
      category,
      purpose: projectInfo.purpose || '',
      architectureSummary: projectInfo.architecture || (projectInfo.stack.length > 0 ? projectInfo.stack.join(', ') : 'Standard'),
      developer: developerInfo,
      environment: environmentInfo,
      accountMetadata,
      branch: gitStatus.branch || state.currentBranch,
      commit: gitStatus.commit?.shortHash || state.lastCommit,
      currentTask: state.currentTask,
      progress: state.progress,
      plan: planData,
      completed: state.completed,
      remaining: state.remaining,
      currentBlocker: state.currentBlocker,
      relevantFiles,
      recentCommits,
      previousFailedApproaches,
      recentDecisions,
      lastSession: latestSession?.id || state.lastSession,
      nextAction,
      hasUncommittedChanges: gitStatus.hasUncommittedChanges,
      uncommittedStats: gitStatus.stats
    };
  }

  formatCompact(ctx: ResumeContext): string {
    const lines: string[] = [
      '================ CONTINUITY RESUME ================\n',
      `Project: ${ctx.project}${ctx.category ? ` [Category: ${ctx.category.toUpperCase()}]` : ''}`
    ];

    if (ctx.environment) {
      lines.push(`Environment: ${ctx.environment.runtime} | ${ctx.environment.packageManager}`);
    }

    lines.push(
      `Branch: ${ctx.branch}${ctx.commit ? ` (${ctx.commit})` : ''}`,
      `Current Task: ${ctx.currentTask} [${ctx.progress}% completed]`,
      `Status: ${ctx.currentBlocker ? `BLOCKED - ${ctx.currentBlocker}` : 'In Progress'}`
    );

    if (ctx.plan) {
      lines.push(
        `Active Plan: ${ctx.plan.title} [${ctx.plan.progressPercentage}% completed]`,
        `Current Step: ${ctx.plan.currentStep || 'None'}`
      );
    }

    lines.push(
      `Uncommitted Changes: ${ctx.hasUncommittedChanges ? 'YES (check git status)' : 'None'}\n`,
      '--- RECENT GIT COMMITS ---'
    );

    if (ctx.recentCommits.length > 0) {
      for (const c of ctx.recentCommits.slice(0, 3)) {
        lines.push(`• ${c.shortHash} ${c.message} (${c.author})`);
      }
    } else {
      lines.push('No recent commits');
    }

    lines.push(
      '\n--- LAST COMPLETED ---',
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
    );

    return lines.filter((l) => l !== '').join('\n');
  }

  formatFullMarkdown(ctx: ResumeContext): string {
    const lines: string[] = [
      '# Continuity Resume Context',
      '\n## 1. Project & Environment',
      `- **Name**: ${ctx.project}`,
      `- **Category**: ${ctx.category ? ctx.category.toUpperCase() : 'Default'}`,
      `- **Purpose**: ${ctx.purpose || 'Not specified'}`,
      `- **Architecture**: ${ctx.architectureSummary}`
    ];

    if (ctx.environment) {
      lines.push(
        `- **Runtime**: \`${ctx.environment.runtime}\``,
        `- **Package Manager**: \`${ctx.environment.packageManager}\``
      );
    }

    if (ctx.accountMetadata) {
      lines.push(`- **Repository Account**: ${ctx.accountMetadata.username} (${ctx.accountMetadata.profile})`);
    }

    lines.push(
      `- **Branch**: \`${ctx.branch}\``,
      `- **Commit**: \`${ctx.commit || 'unknown'}\``,
      `- **Uncommitted Changes**: ${ctx.hasUncommittedChanges ? 'Yes' : 'No'}`
    );

    if (ctx.plan) {
      lines.push(
        '\n## 2. Active Plan',
        `- **Plan**: ${ctx.plan.title} (\`${ctx.plan.id}\`)`,
        `- **Goal**: ${ctx.plan.goal}`,
        `- **Progress**: ${ctx.plan.progressPercentage}%`,
        `- **Current Step**: ${ctx.plan.currentStep || 'None'}`,
        `- **Next Step**: ${ctx.plan.nextStep || 'None'}`
      );
      if (ctx.plan.constraints.length > 0) {
        lines.push(`- **Constraints**:\n${MarkdownHelper.formatBulletList(ctx.plan.constraints, '  *')}`);
      }
    }

    lines.push(
      '\n## 3. Current Task & Progress',
      `- **Task**: ${ctx.currentTask}`,
      `- **Progress**: ${ctx.progress}%`,
      `- **Blocker**: ${ctx.currentBlocker || 'None'}`,
      '\n### Completed',
      MarkdownHelper.formatBulletList(ctx.completed, '✓'),
      '\n### Remaining',
      MarkdownHelper.formatBulletList(ctx.remaining, '□'),
      '\n## 4. Recent Git History'
    );

    if (ctx.recentCommits.length > 0) {
      for (const c of ctx.recentCommits) {
        lines.push(`- \`${c.shortHash}\` **${c.message}** (${c.author}, ${c.date})`);
      }
    } else {
      lines.push('No recent commits.');
    }

    lines.push(
      '\n## 5. Relevant Source Files',
      MarkdownHelper.formatBulletList(ctx.relevantFiles),
      '\n## 6. Architectural Constraints & Key Decisions',
      MarkdownHelper.formatBulletList(ctx.recentDecisions),
      '\n## 7. Failed Approaches ("Do Not Repeat")',
      MarkdownHelper.formatBulletList(ctx.previousFailedApproaches, '⚠️'),
      '\n## 8. Recommended Next Action',
      ctx.nextAction.file ? `- **Open**: \`${ctx.nextAction.file}\`` : '',
      ctx.nextAction.focus ? `- **Focus**: \`${ctx.nextAction.focus}\`` : '',
      `- **Problem**: ${ctx.nextAction.problem}`,
      `- **Expected Solution**: ${ctx.nextAction.expectedSolution}`,
      ctx.nextAction.constraints.length > 0
        ? `- **Constraints**:\n${MarkdownHelper.formatBulletList(ctx.nextAction.constraints, '  *')}`
        : ''
    );

    return lines.filter((l) => l !== '').join('\n');
  }
}
