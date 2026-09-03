import { FileSystem } from '../../core/storage/file-system.js';
import { GitClient } from '../../core/git/git-client.js';
import { StateManager } from '../../core/engine/state-manager.js';
import { TerminalFormatter } from '../formatters/terminal.js';

export interface StatusOptions {
  json?: boolean;
}

export async function runStatus(options: StatusOptions = {}): Promise<void> {
  const fs = new FileSystem();
  if (!fs.isInitialized()) {
    TerminalFormatter.error("Continuity is not initialized in this project. Run 'continuity init' first.");
    process.exitCode = 1;
    return;
  }

  const git = new GitClient();
  const stateManager = new StateManager(fs);

  const state = await stateManager.getState();
  const gitStatus = await git.getStatus();
  const projectInfo = await stateManager.getProjectInfo();

  const projectName = projectInfo.name || state.project;
  const branch = gitStatus.isGitRepo ? gitStatus.branch : state.currentBranch;
  const commit = gitStatus.commit?.shortHash || state.lastCommit || 'unknown';

  if (options.json) {
    console.log(
      JSON.stringify(
        {
          project: projectName,
          branch,
          commit,
          currentTask: state.currentTask,
          status: state.status,
          progress: state.progress,
          completed: state.completed,
          remaining: state.remaining,
          currentFiles: state.currentFiles,
          currentBlocker: state.currentBlocker,
          lastAction: state.lastAction,
          lastSession: state.lastSession,
          nextAction: state.nextAction
        },
        null,
        2
      )
    );
    return;
  }

  TerminalFormatter.section('PROJECT');
  TerminalFormatter.item('Name', projectName);
  TerminalFormatter.item('Branch', branch);
  TerminalFormatter.item('Commit', commit);

  TerminalFormatter.section('CURRENT TASK');
  console.log(state.currentTask);

  TerminalFormatter.section('STATUS');
  console.log(`${state.status} (${state.progress}%)`);

  TerminalFormatter.checklist(state.completed, state.remaining);

  TerminalFormatter.section('LAST WORKED ON');
  if (state.currentFiles.length > 0) {
    for (const f of state.currentFiles) {
      console.log(`- ${f}`);
    }
  } else {
    console.log('None recorded');
  }

  TerminalFormatter.section('LAST SESSION');
  console.log(state.lastSession || 'None recorded');

  TerminalFormatter.section('NEXT ACTION');
  if (typeof state.nextAction === 'string') {
    console.log(state.nextAction);
  } else {
    if (state.nextAction.file) console.log(`Open: ${state.nextAction.file}`);
    if (state.nextAction.focus) console.log(`Focus: ${state.nextAction.focus}`);
    console.log(`Problem: ${state.nextAction.problem}`);
    console.log(`Expected solution: ${state.nextAction.expectedSolution}`);
  }
}
