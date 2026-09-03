import { FileSystem } from '../../core/storage/file-system.js';
import { GitClient } from '../../core/git/git-client.js';
import { StateManager } from '../../core/engine/state-manager.js';
import { TaskManager } from '../../core/engine/task-manager.js';
import { DoctorEngine } from '../../core/engine/doctor-engine.js';
import { GlobalFileSystem } from '../../core/global/global-file-system.js';
import { TerminalFormatter } from '../formatters/terminal.js';

export async function runDoctor(): Promise<void> {
  const fs = new FileSystem();
  const git = new GitClient();
  const stateManager = new StateManager(fs);
  const taskManager = new TaskManager(fs, stateManager);
  const gfs = new GlobalFileSystem();
  const doctor = new DoctorEngine(fs, git, stateManager, taskManager, gfs);

  TerminalFormatter.header('Continuity Doctor Diagnostics');

  const report = await doctor.runDiagnostics();

  for (const check of report.checks) {
    if (check.passed) {
      TerminalFormatter.success(`${check.name}: ${check.message}`);
    } else if (check.warning) {
      TerminalFormatter.warning(`${check.name}: ${check.message}`);
    } else {
      TerminalFormatter.error(`${check.name}: ${check.message}`);
    }
  }

  if (report.overallHealthy) {
    console.log('\n' + 'All essential checks passed. Continuity is healthy!');
  } else {
    console.log('\n' + 'Some checks failed. Review the errors above to restore full integrity.');
    process.exitCode = 1;
  }
}
