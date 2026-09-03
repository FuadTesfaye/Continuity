import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import yaml from 'yaml';
import { ProjectRegistry } from '../types/global.js';

export class GlobalFileSystem {
  public readonly globalDir: string;

  constructor(customGlobalDir?: string) {
    this.globalDir =
      customGlobalDir ||
      process.env.CONTINUITY_GLOBAL_DIR ||
      path.join(os.homedir(), '.continuity');
  }

  resolve(...subpaths: string[]): string {
    return path.join(this.globalDir, ...subpaths);
  }

  exists(filePath?: string): boolean {
    return existsSync(filePath || this.globalDir);
  }

  isInitialized(): boolean {
    return (
      this.exists() &&
      this.exists(this.resolve('config.yml')) &&
      this.exists(this.resolve('projects', 'registry.yml'))
    );
  }

  async ensureDir(dirPath: string): Promise<void> {
    await fs.mkdir(dirPath, { recursive: true });
  }

  async readFile(filePath: string): Promise<string> {
    return fs.readFile(filePath, 'utf-8');
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    await this.ensureDir(path.dirname(filePath));
    const tmpPath = `${filePath}.${Date.now()}.${Math.random().toString(36).substring(7)}.tmp`;
    await fs.writeFile(tmpPath, content, 'utf-8');
    await fs.rename(tmpPath, filePath);
  }

  async readYaml<T>(filePath: string): Promise<T | undefined> {
    if (!this.exists(filePath)) return undefined;
    const content = await this.readFile(filePath);
    try {
      return yaml.parse(content) as T;
    } catch {
      return undefined;
    }
  }

  async writeYaml<T>(filePath: string, data: T): Promise<void> {
    const serialized = yaml.stringify(data);
    await this.writeFile(filePath, serialized);
  }

  async listFiles(dirPath: string, extension?: string): Promise<string[]> {
    if (!this.exists(dirPath)) return [];
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
      if (entry.isFile()) {
        if (!extension || entry.name.endsWith(extension)) {
          files.push(path.join(dirPath, entry.name));
        }
      } else if (entry.isDirectory()) {
        const sub = await this.listFiles(path.join(dirPath, entry.name), extension);
        files.push(...sub);
      }
    }

    return files;
  }

  async initGlobalStructure(): Promise<void> {
    await this.ensureDir(this.globalDir);
    await this.ensureDir(this.resolve('profile'));
    await this.ensureDir(this.resolve('devices'));
    await this.ensureDir(this.resolve('toolchain'));
    await this.ensureDir(this.resolve('accounts'));
    await this.ensureDir(this.resolve('projects'));
    await this.ensureDir(this.resolve('knowledge', 'ai'));
    await this.ensureDir(this.resolve('knowledge', 'architecture'));
    await this.ensureDir(this.resolve('knowledge', 'frontend'));
    await this.ensureDir(this.resolve('knowledge', 'backend'));
    await this.ensureDir(this.resolve('knowledge', 'devops'));
    await this.ensureDir(this.resolve('workflows'));
    await this.ensureDir(this.resolve('history', 'technologies'));
    await this.ensureDir(this.resolve('history', 'lessons'));
    await this.ensureDir(this.resolve('history', 'milestones'));

    // 1. config.yml
    const configPath = this.resolve('config.yml');
    if (!this.exists(configPath)) {
      await this.writeYaml(configPath, {
        version: '3.0',
        activeDevice: os.hostname(),
        defaultPackageManager: 'pnpm',
        defaultProjectType: 'personal',
        isolation: {
          clientIsolationStrict: true
        }
      });
    }

    // 2. profile/developer.md
    const devProfilePath = this.resolve('profile', 'developer.md');
    if (!this.exists(devProfilePath)) {
      await this.writeFile(
        devProfilePath,
        `# Developer Profile

Name: ${os.userInfo().username || 'Developer'}
Role: Software Engineer
Primary Languages: TypeScript, JavaScript, Python
Preferred Architecture: Clean Architecture / Ports and Adapters
UI Preferences: Minimal, fast, accessible, responsive
`
      );
    }

    // 3. profile/preferences.md
    const prefsPath = this.resolve('profile', 'preferences.md');
    if (!this.exists(prefsPath)) {
      await this.writeFile(
        prefsPath,
        `# Developer Preferences

Preferred Package Manager: pnpm
Formatting: 2 spaces, single quotes, semicolons
Testing: Vitest / Jest
Git Workflow: Conventional commits (feat, fix, docs, chore)
Secret Policy: Zero plaintext secrets; use OS keychain references
`
      );
    }

    // 4. projects/registry.yml
    const registryPath = this.resolve('projects', 'registry.yml');
    if (!this.exists(registryPath)) {
      const defaultRegistry: ProjectRegistry = {
        version: '1.0',
        updatedAt: new Date().toISOString(),
        projects: []
      };
      await this.writeYaml(registryPath, defaultRegistry);
    }

    // 5. accounts/profiles.yml
    const accountsPath = this.resolve('accounts', 'profiles.yml');
    if (!this.exists(accountsPath)) {
      await this.writeYaml(accountsPath, {
        version: '1.0',
        updatedAt: new Date().toISOString(),
        accounts: {
          github: {
            personal: {
              provider: 'github',
              profile: 'personal',
              username: os.userInfo().username || 'developer',
              credentialRef: 'keychain://github/personal',
              status: 'authenticated',
              scopes: ['repo', 'read:user'],
              updatedAt: new Date().toISOString()
            }
          }
        }
      });
    }

    // 6. toolchain/runtimes.yml
    const runtimesPath = this.resolve('toolchain', 'runtimes.yml');
    if (!this.exists(runtimesPath)) {
      await this.writeYaml(runtimesPath, {
        defaultNode: process.version,
        defaultPackageManager: 'pnpm',
        preferredDatabase: 'postgresql'
      });
    }
  }
}
