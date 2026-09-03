import { FileSystem } from '../../core/storage/file-system.js';
import { GitClient } from '../../core/git/git-client.js';
import { StateManager } from '../../core/engine/state-manager.js';
import { TaskManager } from '../../core/engine/task-manager.js';
import { DecisionManager } from '../../core/engine/decision-manager.js';
import { FailureManager } from '../../core/engine/failure-manager.js';
import { SessionManager } from '../../core/engine/session-manager.js';
import { ExplainEngine } from '../../core/engine/explain-engine.js';
import { TerminalFormatter } from '../formatters/terminal.js';

export async function runExplain(filePath: string, options: { json?: boolean } = {}): Promise<void> {
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

  const explainEngine = new ExplainEngine(
    fs,
    git,
    taskManager,
    decisionManager,
    failureManager,
    sessionManager
  );

  const explanation = await explainEngine.explain(filePath);

  if (options.json) {
    console.log(JSON.stringify(explanation, null, 2));
    return;
  }

  console.log(explainEngine.formatExplanation(explanation));
}
