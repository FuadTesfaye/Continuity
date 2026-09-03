import { FileSystem } from '../../core/storage/file-system.js';
import { GitClient } from '../../core/git/git-client.js';
import { StateManager } from '../../core/engine/state-manager.js';
import { TaskManager } from '../../core/engine/task-manager.js';
import { DecisionManager } from '../../core/engine/decision-manager.js';
import { FailureManager } from '../../core/engine/failure-manager.js';
import { SessionManager } from '../../core/engine/session-manager.js';
import { HandoverManager } from '../../core/engine/handover-manager.js';
import { TerminalFormatter } from '../formatters/terminal.js';

export interface DoneOptions {
  summary?: string;
  nextProblem?: string;
  nextSolution?: string;
  nextFile?: string;
  agent?: string;
}

export async function runDone(options: DoneOptions = {}): Promise<void> {
  const fs = new FileSystem();
  if (!fs.isInitialized()) {
    TerminalFormatter.error("Continuity is not initialized. Run 'continuity init' first.");
    process.exitCode = 1;
    return;
  }

  const git = new GitClient();
  const stateManager = new StateManager(fs);
  const taskManager = new TaskManager(fs, stateManager);
  const decisionManager = new DecisionManager(fs);
  const failureManager = new FailureManager(fs);
  const sessionManager = new SessionManager(fs, stateManager);
  const handoverManager = new HandoverManager(fs, git, stateManager, decisionManager, failureManager);

  const gitStatus = await git.getStatus();
  const state = await stateManager.getState();

  TerminalFormatter.header('Finalizing Session & Work State');

  const summary = options.summary || `Completed work on ${state.currentTask}`;
  const filesChanged = Array.from(new Set([...gitStatus.modifiedFiles, ...gitStatus.stagedFiles]));

  // 1. Record session summary
  const session = await sessionManager.saveSession({
    agent: options.agent || 'ai',
    branch: gitStatus.branch,
    task: state.currentTask,
    objective: summary,
    workCompleted: [summary],
    filesChanged,
    gitCommit: gitStatus.commit?.shortHash
  });
  TerminalFormatter.success(`Session saved: ${session.id}`);

  // 2. Generate handover
  const nextAction = {
    file: options.nextFile,
    problem: options.nextProblem || 'Continue development with next feature item',
    expectedSolution: options.nextSolution || 'Proceed with implementation',
    constraints: []
  };

  const handover = await handoverManager.createHandover({
    currentTask: state.currentTask,
    progress: state.progress,
    completed: [...state.completed, summary],
    remaining: state.remaining,
    nextAction,
    author: options.agent || 'ai'
  });
  TerminalFormatter.success(`Handover generated: ${handover.id}`);

  TerminalFormatter.box('Session Concluded & State Preserved', [
    `Branch: ${gitStatus.branch}`,
    `Files Changed: ${filesChanged.length}`,
    `Next AI will resume cleanly with:`,
    `  continuity resume`
  ]);
}
