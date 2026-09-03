import os from 'node:os';
import fs from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { GlobalFileSystem } from './global-file-system.js';
import { DeviceEnvironment, EnvironmentDrift } from '../types/global.js';

const execFileAsync = promisify(execFile);

export class DeviceDetector {
  constructor(private readonly gfs: GlobalFileSystem) {}

  private async runCommand(cmd: string, args: string[]): Promise<string> {
    try {
      const { stdout } = await execFileAsync(cmd, args);
      return stdout.trim();
    } catch {
      return '';
    }
  }

  private async getPrettyOsName(): Promise<string> {
    if (os.platform() === 'linux') {
      try {
        const osRelease = await fs.readFile('/etc/os-release', 'utf-8');
        const match = osRelease.match(/PRETTY_NAME="?([^"\n]+)"?/);
        if (match && match[1]) return match[1];
      } catch {}
      return `Linux (${os.release()})`;
    }
    if (os.platform() === 'darwin') {
      return `macOS (${os.release()})`;
    }
    if (os.platform() === 'win32') {
      return `Windows (${os.release()})`;
    }
    return `${os.platform()} ${os.release()}`;
  }

  async probeEnvironment(): Promise<DeviceEnvironment> {
    const hostname = os.hostname();

    const [
      osName,
      nodeV,
      pnpmV,
      npmV,
      yarnV,
      bunV,
      pythonV,
      gitV,
      dockerV,
      psqlV,
      sqliteV
    ] = await Promise.all([
      this.getPrettyOsName(),
      this.runCommand('node', ['-v']),
      this.runCommand('pnpm', ['-v']),
      this.runCommand('npm', ['-v']),
      this.runCommand('yarn', ['-v']),
      this.runCommand('bun', ['-v']),
      this.runCommand('python3', ['--version']).then((v) => v || this.runCommand('python', ['--version'])),
      this.runCommand('git', ['--version']),
      this.runCommand('docker', ['--version']),
      this.runCommand('psql', ['--version']),
      this.runCommand('sqlite3', ['--version'])
    ]);

    // Runtimes
    const runtimes: Record<string, string> = {};
    if (nodeV) runtimes.node = nodeV.replace(/^v/, '');
    if (pnpmV) runtimes.pnpm = pnpmV;
    if (npmV) runtimes.npm = npmV;
    if (yarnV) runtimes.yarn = yarnV;
    if (bunV) runtimes.bun = bunV;
    if (pythonV) runtimes.python = pythonV.replace(/^Python\s*/i, '');

    // Tools
    const tools: Record<string, string> = {};
    if (gitV) tools.git = gitV.replace(/^git version\s*/i, '');
    if (dockerV) tools.docker = dockerV.replace(/^Docker version\s*/i, '').split(',')[0];
    if (psqlV) tools.postgresql = psqlV.replace(/^psql \(PostgreSQL\)\s*/i, '');
    if (sqliteV) tools.sqlite = sqliteV.split(' ')[0];

    const shell = process.env.SHELL ? process.env.SHELL.split('/').pop() : undefined;
    const defaultEditor = process.env.EDITOR || process.env.VISUAL || 'VS Code';
    const packageManager = runtimes.pnpm ? 'pnpm' : runtimes.npm ? 'npm' : 'unknown';

    return {
      id: hostname.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name: `${hostname} (${osName})`,
      hostname,
      os: {
        name: osName,
        platform: os.platform(),
        release: os.release(),
        arch: os.arch()
      },
      runtimes,
      tools,
      shell,
      defaultEditor,
      packageManager,
      updatedAt: new Date().toISOString()
    };
  }

  async getStoredEnvironment(deviceId?: string): Promise<DeviceEnvironment | undefined> {
    const id = deviceId || os.hostname().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const deviceFile = this.gfs.resolve('devices', `${id}.yml`);
    return this.gfs.readYaml<DeviceEnvironment>(deviceFile);
  }

  async syncEnvironment(deviceId?: string): Promise<DeviceEnvironment> {
    await this.gfs.initGlobalStructure();
    const live = await this.probeEnvironment();
    const id = deviceId || live.id;
    const deviceFile = this.gfs.resolve('devices', `${id}.yml`);
    await this.gfs.writeYaml(deviceFile, live);
    return live;
  }

  async detectDrift(deviceId?: string): Promise<EnvironmentDrift[]> {
    const stored = await this.getStoredEnvironment(deviceId);
    const live = await this.probeEnvironment();

    if (!stored) {
      // First time, no drift but needs sync
      return [];
    }

    const drifts: EnvironmentDrift[] = [];

    // Compare runtimes
    const allRuntimeKeys = Array.from(new Set([...Object.keys(stored.runtimes), ...Object.keys(live.runtimes)]));
    for (const r of allRuntimeKeys) {
      const sVal = stored.runtimes[r] || 'none';
      const lVal = live.runtimes[r] || 'none';
      if (sVal !== lVal) {
        drifts.push({
          tool: r,
          storedVersion: sVal,
          currentVersion: lVal,
          driftDetected: true
        });
      }
    }

    // Compare tools
    const allToolKeys = Array.from(new Set([...Object.keys(stored.tools), ...Object.keys(live.tools)]));
    for (const t of allToolKeys) {
      const sVal = stored.tools[t] || 'none';
      const lVal = live.tools[t] || 'none';
      if (sVal !== lVal) {
        drifts.push({
          tool: t,
          storedVersion: sVal,
          currentVersion: lVal,
          driftDetected: true
        });
      }
    }

    return drifts;
  }
}
