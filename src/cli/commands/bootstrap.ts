import { FileSystem } from '../../core/storage/file-system.js';
import { GlobalFileSystem } from '../../core/global/global-file-system.js';
import { BootstrapEngine } from '../../core/global/bootstrap-engine.js';
import { TerminalFormatter } from '../formatters/terminal.js';

export interface BootstrapOptions {
  generate?: string;
}

export async function runBootstrap(options: BootstrapOptions = {}): Promise<void> {
  const fs = new FileSystem();
  const gfs = new GlobalFileSystem();
  await gfs.initGlobalStructure();

  const engine = new BootstrapEngine(fs, gfs);

  if (options.generate) {
    const genType = options.generate.toLowerCase();
    if (genType !== 'mise' && genType !== 'nvm' && genType !== 'tool-versions') {
      TerminalFormatter.error('Invalid generator type. Supported types: mise, nvm, tool-versions');
      process.exitCode = 1;
      return;
    }
    const result = await engine.generateConfig(genType as any);
    TerminalFormatter.success(`Generated environment config at ${result.path}:`);
    console.log(result.content);
    return;
  }

  TerminalFormatter.header('Continuity Environment Bootstrap');

  const report = await engine.checkEnvironment();
  console.log(`Checking requirements for project: ${report.projectName}`);

  TerminalFormatter.section('TOOLCHAIN STATUS');
  for (const check of report.checks) {
    if (check.satisfied) {
      TerminalFormatter.success(`${check.tool.padEnd(24)}: ${check.installed}`);
    } else {
      TerminalFormatter.error(`${check.tool.padEnd(24)}: ${check.installed}`);
      if (check.recommendation) {
        console.log(`    ↳ Recommendation: ${check.recommendation}`);
      }
    }
  }

  TerminalFormatter.section('BOOTSTRAP VERDICT');
  if (report.allSatisfied) {
    TerminalFormatter.success('All required runtimes and tools are installed and ready to develop!');
  } else {
    TerminalFormatter.warning(
      `${report.missingCount} tool(s) are missing or misconfigured. Follow recommendations above.`
    );
  }

  console.log('\nTip: Run "continuity bootstrap --generate mise" to generate a toolchain file.');
}
