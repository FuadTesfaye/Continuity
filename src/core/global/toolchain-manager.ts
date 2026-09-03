import path from 'node:path';
import { GlobalFileSystem } from './global-file-system.js';
import { FileSystem } from '../storage/file-system.js';
import { DeviceDetector } from './device-detector.js';
import { EffectiveToolchain } from '../types/global.js';

export class ToolchainManager {
  constructor(
    private readonly gfs: GlobalFileSystem,
    private readonly projectFs?: FileSystem,
    private readonly detector?: DeviceDetector
  ) {}

  async resolveEffectiveToolchain(taskOverride?: {
    nodeVersion?: string;
    packageManager?: string;
  }): Promise<EffectiveToolchain> {
    const deviceDetector = this.detector || new DeviceDetector(this.gfs);
    const device = (await deviceDetector.getStoredEnvironment()) || (await deviceDetector.probeEnvironment());

    // 1. Runtime Resolution
    let runtimeVersion = device.runtimes.node || process.version.replace(/^v/, '');
    let runtimeSource: EffectiveToolchain['runtime']['source'] = 'global';

    // Project detection
    if (this.projectFs) {
      // Check package.json
      const pkgPath = this.projectFs.resolve('package.json');
      if (this.projectFs.exists(pkgPath)) {
        try {
          const pkg = JSON.parse(await this.projectFs.readFile(pkgPath));
          if (pkg.engines && pkg.engines.node) {
            runtimeVersion = pkg.engines.node;
            runtimeSource = 'project';
          }
        } catch {}
      }

      // Check .nvmrc
      const nvmrcPath = this.projectFs.resolve('.nvmrc');
      if (this.projectFs.exists(nvmrcPath)) {
        try {
          const nvmrc = (await this.projectFs.readFile(nvmrcPath)).trim();
          if (nvmrc) {
            runtimeVersion = nvmrc.replace(/^v/, '');
            runtimeSource = 'project';
          }
        } catch {}
      }
    }

    // Task override
    if (taskOverride?.nodeVersion) {
      runtimeVersion = taskOverride.nodeVersion;
      runtimeSource = 'task';
    }

    // 2. Package Manager Resolution
    let pmName = device.packageManager || 'pnpm';
    let pmVersion = device.runtimes[pmName];
    let pmSource: EffectiveToolchain['packageManager']['source'] = 'global';

    if (this.projectFs) {
      if (this.projectFs.exists(this.projectFs.resolve('pnpm-lock.yaml'))) {
        pmName = 'pnpm';
        pmVersion = device.runtimes.pnpm;
        pmSource = 'detected';
      } else if (this.projectFs.exists(this.projectFs.resolve('yarn.lock'))) {
        pmName = 'yarn';
        pmVersion = device.runtimes.yarn;
        pmSource = 'detected';
      } else if (this.projectFs.exists(this.projectFs.resolve('bun.lockb')) || this.projectFs.exists(this.projectFs.resolve('bun.lock'))) {
        pmName = 'bun';
        pmVersion = device.runtimes.bun;
        pmSource = 'detected';
      } else if (this.projectFs.exists(this.projectFs.resolve('package-lock.json'))) {
        pmName = 'npm';
        pmVersion = device.runtimes.npm;
        pmSource = 'detected';
      }

      // package.json packageManager field takes precedence
      const pkgPath = this.projectFs.resolve('package.json');
      if (this.projectFs.exists(pkgPath)) {
        try {
          const pkg = JSON.parse(await this.projectFs.readFile(pkgPath));
          if (pkg.packageManager) {
            const [name, version] = pkg.packageManager.split('@');
            pmName = name;
            pmVersion = version;
            pmSource = 'project';
          }
        } catch {}
      }
    }

    if (taskOverride?.packageManager) {
      pmName = taskOverride.packageManager;
      pmSource = 'task';
    }

    // 3. Tools
    const tools: EffectiveToolchain['tools'] = [];
    if (device.tools.git) {
      tools.push({ name: 'git', version: device.tools.git, source: 'global' });
    }
    if (device.tools.docker) {
      tools.push({ name: 'docker', version: device.tools.docker, source: 'global' });
    }
    if (device.tools.postgresql) {
      tools.push({ name: 'postgresql', version: device.tools.postgresql, source: 'global' });
    }
    if (device.tools.sqlite) {
      tools.push({ name: 'sqlite', version: device.tools.sqlite, source: 'global' });
    }

    return {
      runtime: {
        name: 'node',
        version: runtimeVersion,
        source: runtimeSource
      },
      packageManager: {
        name: pmName,
        version: pmVersion,
        source: pmSource
      },
      tools
    };
  }
}
