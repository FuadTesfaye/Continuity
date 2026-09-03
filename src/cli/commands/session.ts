import { FileSystem } from '../../core/storage/file-system.js';
import { GitClient } from '../../core/git/git-client.js';
import { StateManager } from '../../core/engine/state-manager.js';
import { SessionManager } from '../../core/engine/session-manager.js';
import { TerminalFormatter } from '../formatters/terminal.js';

export interface SessionSaveOptions {
  agent?: string;
  objective?: string;
  completed?: string;
  files?: string;
  decisions?: string;
  failed?: string;
  problems?: string;
  next?: string;
  context?: string;
  rawFile?: string;
}

export async function runSessionSave(options: SessionSaveOptions = {}): Promise<void> {
  const fs = new FileSystem();
  if (!fs.isInitialized()) {
    TerminalFormatter.error("Continuity is not initialized. Run 'continuity init' first.");
    process.exitCode = 1;
    return;
  }

  const git = new GitClient();
  const stateManager = new StateManager(fs);
  const sessionManager = new SessionManager(fs, stateManager);

  const gitStatus = await git.getStatus();
  const currentState = await stateManager.getState();

  const objective = options.objective || `Work on ${currentState.currentTask}`;
  const workCompleted = options.completed ? options.completed.split(',').map((s) => s.trim()) : currentState.completed;
  const filesChanged = options.files ? options.files.split(',').map((s) => s.trim()) : gitStatus.modifiedFiles;
  const decisions = options.decisions ? options.decisions.split(',').map((s) => s.trim()) : [];
  const failedApproaches = options.failed ? options.failed.split(',').map((s) => s.trim()) : [];
  const problems = options.problems ? options.problems.split(',').map((s) => s.trim()) : [];

  let rawContent: string | undefined;
  if (options.rawFile && fs.exists(options.rawFile)) {
    rawContent = await fs.readFile(options.rawFile);
  }

  const session = await sessionManager.saveSession(
    {
      agent: options.agent || 'ai',
      branch: gitStatus.branch,
      task: currentState.currentTask,
      objective,
      workCompleted,
      filesChanged,
      decisions,
      failedApproaches,
      problems,
      nextStep: options.next,
      importantContext: options.context,
      gitCommit: gitStatus.commit?.shortHash
    },
    rawContent
  );

  TerminalFormatter.success(`Session recorded: ${session.id}`);
  TerminalFormatter.item('Date', session.date);
  TerminalFormatter.item('Agent', session.agent);
  TerminalFormatter.item('Objective', session.objective);
  TerminalFormatter.item('Files Changed', session.filesChanged.length);
}

export async function runSessionList(): Promise<void> {
  const fs = new FileSystem();
  if (!fs.isInitialized()) {
    TerminalFormatter.error("Continuity is not initialized. Run 'continuity init' first.");
    process.exitCode = 1;
    return;
  }

  const stateManager = new StateManager(fs);
  const sessionManager = new SessionManager(fs, stateManager);
  const sessions = await sessionManager.listSessions();

  TerminalFormatter.header(`Recorded Sessions (${sessions.length})`);
  if (sessions.length === 0) {
    console.log('No sessions recorded yet.');
    return;
  }

  for (const s of sessions) {
    console.log(`\n• ${s.id} (${s.date}) [${s.agent}]`);
    console.log(`  Objective: ${s.objective}`);
    if (s.filesChanged.length > 0) {
      console.log(`  Files: ${s.filesChanged.join(', ')}`);
    }
  }
}
