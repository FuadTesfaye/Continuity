import { FileSystem } from '../../core/storage/file-system.js';
import { GitClient } from '../../core/git/git-client.js';
import { StateManager } from '../../core/engine/state-manager.js';
import { TaskManager } from '../../core/engine/task-manager.js';
import { PlanManager } from '../../core/engine/plan-manager.js';
import { DecisionManager } from '../../core/engine/decision-manager.js';
import { FailureManager } from '../../core/engine/failure-manager.js';
import { SessionManager } from '../../core/engine/session-manager.js';
import { ContextRanker } from '../../core/context/context-ranker.js';
import { TerminalFormatter } from '../formatters/terminal.js';

export async function runPromptCommand(taskName?: string): Promise<void> {
  const fs = new FileSystem();
  if (!fs.isInitialized()) {
    TerminalFormatter.error("Continuity is not initialized. Run 'continuity init' first.");
    process.exitCode = 1;
    return;
  }

  const git = new GitClient();
  const stateManager = new StateManager(fs);
  const taskManager = new TaskManager(fs, stateManager);
  const planManager = new PlanManager(fs);
  const decisionManager = new DecisionManager(fs);
  const failureManager = new FailureManager(fs);
  const sessionManager = new SessionManager(fs, stateManager);
  const ranker = new ContextRanker();

  const state = await stateManager.getState();
  const gitStatus = await git.getStatus();
  const recentCommits = await git.getRecentCommits(10);
  const sessions = await sessionManager.listSessions();
  const decisions = await decisionManager.listDecisions();
  const failures = await failureManager.listFailures();
  const activePlan = await planManager.getActivePlan();

  const allTasks = await taskManager.listTasks();
  const activeTask =
    allTasks.active.find((t) => (taskName ? t.title.toLowerCase().includes(taskName.toLowerCase()) : true)) ||
    allTasks.active[0];

  const uncommittedDiff = gitStatus.hasUncommittedChanges ? await git.getContextDiff() : undefined;

  const ranked = ranker.rank({
    task: activeTask,
    plan: activePlan,
    currentFiles: state.currentFiles,
    recentCommits,
    sessions,
    decisions,
    failures,
    uncommittedDiff,
    branch: gitStatus.branch,
    headCommit: gitStatus.commit?.shortHash
  });

  const promptOutput = ranker.formatPrompt(ranked, uncommittedDiff);
  console.log(promptOutput);
}
