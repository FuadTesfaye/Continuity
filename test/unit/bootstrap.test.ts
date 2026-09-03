import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { GlobalFileSystem } from '../../src/core/global/global-file-system.js';
import { FileSystem } from '../../src/core/storage/file-system.js';
import { BootstrapEngine } from '../../src/core/global/bootstrap-engine.js';

describe('BootstrapEngine', () => {
  let tmpGlobalDir: string;
  let tmpProjectDir: string;
  let gfs: GlobalFileSystem;
  let pfs: FileSystem;
  let bootstrap: BootstrapEngine;

  beforeEach(async () => {
    tmpGlobalDir = await fs.mkdtemp(path.join(os.tmpdir(), 'continuity-boot-gfs-'));
    tmpProjectDir = await fs.mkdtemp(path.join(os.tmpdir(), 'continuity-boot-pfs-'));
    gfs = new GlobalFileSystem(tmpGlobalDir);
    pfs = new FileSystem(tmpProjectDir);
    bootstrap = new BootstrapEngine(pfs, gfs);
  });

  afterEach(async () => {
    await fs.rm(tmpGlobalDir, { recursive: true, force: true });
    await fs.rm(tmpProjectDir, { recursive: true, force: true });
  });

  it('evaluates project environment requirements against live tools', async () => {
    await pfs.writeFile(
      pfs.resolve('package.json'),
      JSON.stringify({
        name: 'sample-project',
        engines: { node: '>=20.0.0' },
        packageManager: 'pnpm@10.0.0',
        dependencies: {
          sqlite3: '^5.0.0'
        }
      })
    );

    const report = await bootstrap.checkEnvironment();
    expect(report.projectName).toBe('sample-project');
    expect(report.checks.length).toBeGreaterThanOrEqual(3);

    const nodeCheck = report.checks.find((c) => c.tool === 'Node.js');
    expect(nodeCheck).toBeDefined();
    expect(nodeCheck?.satisfied).toBe(true);
  });

  it('generates toolchain configuration files (mise, nvm, tool-versions)', async () => {
    const mise = await bootstrap.generateConfig('mise');
    expect(pfs.exists(mise.path)).toBe(true);
    expect(mise.content).toContain('[tools]');

    const nvm = await bootstrap.generateConfig('nvm');
    expect(pfs.exists(nvm.path)).toBe(true);
    expect(nvm.content).toMatch(/v\d+/);
  });
});
