import { FileSystem } from '../../core/storage/file-system.js';
import { GitClient } from '../../core/git/git-client.js';
import { StateManager } from '../../core/engine/state-manager.js';
import { HandoverManager } from '../../core/engine/handover-manager.js';
import { SessionManager } from '../../core/engine/session-manager.js';
import { FailureManager } from '../../core/engine/failure-manager.js';
import { DecisionManager } from '../../core/engine/decision-manager.js';
import { PlanManager } from '../../core/engine/plan-manager.js';
import { ResumeEngine } from '../../core/engine/resume-engine.js';
import { TerminalFormatter } from '../formatters/terminal.js';

export interface ResumeOptions {
  compact?: boolean;
  full?: boolean;
  json?: boolean;
}

export async function runResume(options: ResumeOptions = {}): Promise<void> {
  const fs = new FileSystem();
  if (!fs.isInitialized()) {
    TerminalFormatter.error("Continuity is not initialized in this project. Run 'continuity init' first.");
    process.exitCode = 1;
    return;
  }

  const git = new GitClient();
  const stateManager = new StateManager(fs);
  const decisionManager = new DecisionManager(fs);
  const failureManager = new FailureManager(fs);
  const handoverManager = new HandoverManager(fs, git, stateManager, decisionManager, failureManager);
  const sessionManager = new SessionManager(fs, stateManager);
  const planManager = new PlanManager(fs);

  const resumeEngine = new ResumeEngine(
    stateManager,
    handoverManager,
    sessionManager,
    failureManager,
    decisionManager,
    git,
    planManager
  );

  const context = await resumeEngine.buildContext();

  if (options.json) {
    console.log(JSON.stringify(context, null, 2));
    return;
  }

  if (options.full) {
    console.log(resumeEngine.formatFullMarkdown(context));
    return;
  }

  // Default: compact prompt payload
  console.log(resumeEngine.formatCompact(context));
}
