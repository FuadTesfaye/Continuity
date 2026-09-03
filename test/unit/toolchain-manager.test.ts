import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { GlobalFileSystem } from '../../src/core/global/global-file-system.js';
import { FileSystem } from '../../src/core/storage/file-system.js';
import { ToolchainManager } from '../../src/core/global/toolchain-manager.js';

describe('ToolchainManager', () => {
  let tmpGlobalDir: string;
  let tmpProjectDir: string;
  let gfs: GlobalFileSystem;
  let pfs: FileSystem;

  beforeEach(async () => {
    tmpGlobalDir = await fs.mkdtemp(path.join(os.tmpdir(), 'continuity-gfs-toolchain-'));
    tmpProjectDir = await fs.mkdtemp(path.join(os.tmpdir(), 'continuity-pfs-toolchain-'));
    gfs = new GlobalFileSystem(tmpGlobalDir);
    pfs = new FileSystem(tmpProjectDir);
    await gfs.initGlobalStructure();
  });

  afterEach(async () => {
    await fs.rm(tmpGlobalDir, { recursive: true, force: true });
    await fs.rm(tmpProjectDir, { recursive: true, force: true });
  });

  it('resolves global defaults when project has no specific requirements', async () => {
    const manager = new ToolchainManager(gfs, pfs);
    const effective = await manager.resolveEffectiveToolchain();

    expect(effective.runtime.name).toBe('node');
    expect(effective.packageManager.name).toBeTruthy();
  });

  it('allows project package.json to override runtime and package manager', async () => {
    // Write package.json with engine and packageManager requirements
    await pfs.writeFile(
      pfs.resolve('package.json'),
      JSON.stringify({
        name: 'test-client-project',
        engines: {
          node: '20.12.0'
        },
        packageManager: 'pnpm@9.5.0'
      })
    );

    const manager = new ToolchainManager(gfs, pfs);
    const effective = await manager.resolveEffectiveToolchain();

    expect(effective.runtime.version).toBe('20.12.0');
    expect(effective.runtime.source).toBe('project');
    expect(effective.packageManager.name).toBe('pnpm');
    expect(effective.packageManager.version).toBe('9.5.0');
    expect(effective.packageManager.source).toBe('project');
  });

  it('allows task override to take highest precedence', async () => {
    await pfs.writeFile(
      pfs.resolve('package.json'),
      JSON.stringify({
        name: 'test-project',
        engines: { node: '20.x' }
      })
    );

    const manager = new ToolchainManager(gfs, pfs);
    const effective = await manager.resolveEffectiveToolchain({
      nodeVersion: '22.0.0-task-override',
      packageManager: 'bun'
    });

    expect(effective.runtime.version).toBe('22.0.0-task-override');
    expect(effective.runtime.source).toBe('task');
    expect(effective.packageManager.name).toBe('bun');
    expect(effective.packageManager.source).toBe('task');
  });
});
