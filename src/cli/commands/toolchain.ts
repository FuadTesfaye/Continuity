import { GlobalFileSystem } from '../../core/global/global-file-system.js';
import { FileSystem } from '../../core/storage/file-system.js';
import { ToolchainManager } from '../../core/global/toolchain-manager.js';
import { TerminalFormatter } from '../formatters/terminal.js';

export interface ToolchainOptions {
  json?: boolean;
}

export async function runToolchain(options: ToolchainOptions = {}): Promise<void> {
  const gfs = new GlobalFileSystem();
  await gfs.initGlobalStructure();

  const projectFs = new FileSystem();
  const manager = new ToolchainManager(gfs, projectFs);

  const effective = await manager.resolveEffectiveToolchain();

  if (options.json) {
    console.log(JSON.stringify(effective, null, 2));
    return;
  }

  TerminalFormatter.header('Hierarchical Toolchain Resolution');

  TerminalFormatter.section('EFFECTIVE RUNTIME');
  TerminalFormatter.item('Runtime', `${effective.runtime.name} ${effective.runtime.version}`);
  TerminalFormatter.item('Source', `${effective.runtime.source.toUpperCase()} configuration`);

  TerminalFormatter.section('PACKAGE MANAGER');
  TerminalFormatter.item(
    'Package Manager',
    effective.packageManager.version
      ? `${effective.packageManager.name} ${effective.packageManager.version}`
      : effective.packageManager.name
  );
  TerminalFormatter.item('Source', `${effective.packageManager.source.toUpperCase()} configuration`);

  TerminalFormatter.section('DEVELOPER TOOLS');
  for (const t of effective.tools) {
    TerminalFormatter.item(t.name, `${t.version || 'installed'} (${t.source})`);
  }

  TerminalFormatter.box('Resolution Hierarchy Rule', [
    'Task Override  >  Project Config  >  Global Default',
    'The local repository configuration always wins.'
  ]);
}
