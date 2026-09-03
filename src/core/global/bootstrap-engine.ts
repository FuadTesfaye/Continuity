import { FileSystem } from '../storage/file-system.js';
import { GlobalFileSystem } from './global-file-system.js';
import { DeviceDetector } from './device-detector.js';

export interface BootstrapCheck {
  tool: string;
  required?: string;
  installed?: string;
  satisfied: boolean;
  recommendation?: string;
}

export interface BootstrapReport {
  projectName: string;
  checks: BootstrapCheck[];
  missingCount: number;
  allSatisfied: boolean;
}

export class BootstrapEngine {
  constructor(
    private readonly fs: FileSystem,
    private readonly gfs: GlobalFileSystem
  ) {}

  async checkEnvironment(): Promise<BootstrapReport> {
    const detector = new DeviceDetector(this.gfs);
    const live = await detector.probeEnvironment();
    const checks: BootstrapCheck[] = [];

    // Project Name & Requirements
    let projectName = 'Current Project';
    let requiredNode = '>=20.0.0';
    let requiredPm = 'pnpm';
    const requiredTools: string[] = ['git'];

    const pkgPath = this.fs.resolve('package.json');
    if (this.fs.exists(pkgPath)) {
      try {
        const pkg = JSON.parse(await this.fs.readFile(pkgPath));
        if (pkg.name) projectName = pkg.name;
        if (pkg.engines && pkg.engines.node) requiredNode = pkg.engines.node;
        if (pkg.packageManager) {
          requiredPm = pkg.packageManager.split('@')[0];
        } else if (this.fs.exists(this.fs.resolve('pnpm-lock.yaml'))) {
          requiredPm = 'pnpm';
        } else if (this.fs.exists(this.fs.resolve('package-lock.json'))) {
          requiredPm = 'npm';
        } else if (this.fs.exists(this.fs.resolve('yarn.lock'))) {
          requiredPm = 'yarn';
        } else if (this.fs.exists(this.fs.resolve('bun.lockb'))) {
          requiredPm = 'bun';
        }

        // Check if database dependencies are present
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        if (deps.pg || deps['@prisma/client'] || deps.typeorm || deps.drizzle) {
          requiredTools.push('postgresql');
        }
        if (deps.sqlite3 || deps['better-sqlite3']) {
          requiredTools.push('sqlite');
        }
      } catch {}
    }

    // Check 1: Node.js
    const installedNode = live.runtimes.node;
    const nodeSatisfied = !!installedNode;
    checks.push({
      tool: 'Node.js',
      required: requiredNode,
      installed: installedNode || 'Not found',
      satisfied: nodeSatisfied,
      recommendation: !nodeSatisfied ? 'Install Node.js via nvm, fnm, or system package manager' : undefined
    });

    // Check 2: Package Manager
    const installedPm = live.runtimes[requiredPm];
    const pmSatisfied = !!installedPm;
    checks.push({
      tool: `Package Manager (${requiredPm})`,
      required: requiredPm,
      installed: installedPm ? `${requiredPm} ${installedPm}` : 'Not found',
      satisfied: pmSatisfied,
      recommendation: !pmSatisfied ? `Run: corepack enable && corepack use ${requiredPm}@latest` : undefined
    });

    // Check 3: Git
    const installedGit = live.tools.git;
    checks.push({
      tool: 'Git',
      required: '>=2.0.0',
      installed: installedGit || 'Not found',
      satisfied: !!installedGit,
      recommendation: !installedGit ? 'Install Git via your package manager (e.g. sudo dnf install git)' : undefined
    });

    // Check additional tools
    for (const tool of requiredTools) {
      if (tool === 'git') continue;
      const installedTool = live.tools[tool];
      const satisfied = !!installedTool;
      checks.push({
        tool: tool.toUpperCase(),
        required: 'Installed',
        installed: installedTool || 'Not found',
        satisfied,
        recommendation: !satisfied ? `Optional client tool '${tool}' is recommended for this project.` : undefined
      });
    }

    const missingCount = checks.filter((c) => !c.satisfied).length;
    return {
      projectName,
      checks,
      missingCount,
      allSatisfied: missingCount === 0
    };
  }

  async generateConfig(type: 'mise' | 'nvm' | 'tool-versions'): Promise<{ path: string; content: string }> {
    const report = await this.checkEnvironment();
    let nodeVer = '22.x';
    const nodeCheck = report.checks.find((c) => c.tool === 'Node.js');
    if (nodeCheck && nodeCheck.installed && nodeCheck.installed !== 'Not found') {
      nodeVer = nodeCheck.installed;
    }

    let filePath = '';
    let content = '';

    if (type === 'nvm') {
      filePath = this.fs.resolve('.nvmrc');
      content = `v${nodeVer}\n`;
    } else if (type === 'tool-versions') {
      filePath = this.fs.resolve('.tool-versions');
      content = `nodejs ${nodeVer}\n`;
    } else if (type === 'mise') {
      filePath = this.fs.resolve('mise.toml');
      content = `[tools]\nnode = "${nodeVer}"\npnpm = "latest"\n`;
    }

    await this.fs.writeFile(filePath, content);
    return { path: filePath, content };
  }
}
