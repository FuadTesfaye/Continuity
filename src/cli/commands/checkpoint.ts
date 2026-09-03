import path from 'node:path';
import { FileSystem } from '../../core/storage/file-system.js';
import { StateManager } from '../../core/engine/state-manager.js';
import { GitClient } from '../../core/git/git-client.js';
import { TerminalFormatter } from '../formatters/terminal.js';

export async function runCheckpoint(name?: string): Promise<void> {
  const fs = new FileSystem();
  if (!fs.isInitialized()) {
    TerminalFormatter.error("Continuity is not initialized. Run 'continuity init' first.");
    process.exitCode = 1;
    return;
  }

  const git = new GitClient();
  const stateManager = new StateManager(fs);

  const state = await stateManager.getState();
  const gitStatus = await git.getStatus();

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = `${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
  const slug = (name || state.currentTask)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 30);

  const snapshotId = `${dateStr}-${timeStr}-${slug}`;
  const snapshotsDir = fs.resolveContinuity('snapshots');
  await fs.ensureDir(snapshotsDir);

  const snapshotPath = path.join(snapshotsDir, `${snapshotId}.md`);
  const content = await fs.readFile(fs.resolveContinuity('state.md'));

  await fs.writeFile(snapshotPath, content);

  TerminalFormatter.success(`Checkpoint snapshot created: ${snapshotId}`);
  TerminalFormatter.item('Snapshot File', `.continuity/snapshots/${snapshotId}.md`);
  TerminalFormatter.item('Branch', gitStatus.branch);
  TerminalFormatter.item('Commit', gitStatus.commit?.shortHash || 'uncommitted');
}

export async function runRestoreContext(snapshotId: string): Promise<void> {
  const fs = new FileSystem();
  if (!fs.isInitialized()) {
    TerminalFormatter.error("Continuity is not initialized. Run 'continuity init' first.");
    process.exitCode = 1;
    return;
  }

  const snapshotsDir = fs.resolveContinuity('snapshots');
  const files = await fs.listFiles(snapshotsDir, '.md');

  const match = files.find((f) => path.basename(f, '.md').includes(snapshotId));
  if (!match) {
    TerminalFormatter.error(`Snapshot matching '${snapshotId}' not found in .continuity/snapshots/`);
    process.exitCode = 1;
    return;
  }

  const content = await fs.readFile(match);
  await fs.writeFile(fs.resolveContinuity('state.md'), content);

  TerminalFormatter.success(`Restored state context from snapshot: ${path.basename(match)}`);
  TerminalFormatter.info('Run "continuity status" to view the restored work state.');
}
