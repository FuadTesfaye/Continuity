import { FileSystem } from '../../core/storage/file-system.js';
import { StateManager } from '../../core/engine/state-manager.js';
import { TaskManager } from '../../core/engine/task-manager.js';
import { DecisionManager } from '../../core/engine/decision-manager.js';
import { FailureManager } from '../../core/engine/failure-manager.js';
import { TerminalFormatter } from '../formatters/terminal.js';

export interface ExportOptions {
  output?: string;
  json?: boolean;
}

export async function runExport(options: ExportOptions = {}): Promise<void> {
  const fs = new FileSystem();
  if (!fs.isInitialized()) {
    TerminalFormatter.error("Continuity is not initialized. Run 'continuity init' first.");
    process.exitCode = 1;
    return;
  }

  const stateManager = new StateManager(fs);
  const taskManager = new TaskManager(fs, stateManager);
  const decisionManager = new DecisionManager(fs);
  const failureManager = new FailureManager(fs);

  const state = await stateManager.getState();
  const projectInfo = await stateManager.getProjectInfo();
  const architecture = await stateManager.getArchitecture();
  const tasks = await taskManager.listTasks();
  const decisions = await decisionManager.listDecisions();
  const failures = await failureManager.listFailures();

  if (options.json) {
    const payload = JSON.stringify(
      {
        project: projectInfo,
        state,
        architecture,
        tasks,
        decisions,
        failures,
        exportedAt: new Date().toISOString()
      },
      null,
      2
    );

    if (options.output) {
      await fs.writeFile(fs.resolve(options.output), payload);
      TerminalFormatter.success(`Exported JSON context to ${options.output}`);
    } else {
      console.log(payload);
    }
    return;
  }

  const bundle = `# Continuity Context Bundle: ${projectInfo.name}

Generated at: ${new Date().toISOString()}

---

## 1. Project Information
- **Name**: ${projectInfo.name}
- **Purpose**: ${projectInfo.purpose}
- **Stack**: ${projectInfo.stack.join(', ')}

---

## 2. Current State
- **Branch**: ${state.currentBranch}
- **Task**: ${state.currentTask}
- **Progress**: ${state.progress}%
- **Blocker**: ${state.currentBlocker || 'None'}
- **Next Action**:
${typeof state.nextAction === 'string' ? state.nextAction : state.nextAction.problem + ' -> ' + state.nextAction.expectedSolution}

---

## 3. Architecture
${architecture}

---

## 4. Architecture Decisions (${decisions.length})
${decisions.map((d) => `### [${d.id}] ${d.title}\n- **Decision**: ${d.decision}\n- **Why**: ${d.why}`).join('\n\n')}

---

## 5. Documented Failures & Lessons (${failures.length})
${failures.map((f) => `### ${f.title}\n- **Attempt**: ${f.attempt}\n- **Result**: ${f.result}\n- **Do Not Repeat**: ${f.doNotRepeat}\n- **Better**: ${f.betterApproach}`).join('\n\n')}
`;

  if (options.output) {
    await fs.writeFile(fs.resolve(options.output), bundle);
    TerminalFormatter.success(`Exported Markdown context bundle to ${options.output}`);
  } else {
    console.log(bundle);
  }
}
