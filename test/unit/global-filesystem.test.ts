import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { GlobalFileSystem } from '../../src/core/global/global-file-system.js';

describe('GlobalFileSystem', () => {
  let tmpGlobalDir: string;
  let gfs: GlobalFileSystem;

  beforeEach(async () => {
    tmpGlobalDir = await fs.mkdtemp(path.join(os.tmpdir(), 'continuity-global-test-'));
    gfs = new GlobalFileSystem(tmpGlobalDir);
  });

  afterEach(async () => {
    await fs.rm(tmpGlobalDir, { recursive: true, force: true });
  });

  it('initializes global directory structure with default profiles and registry', async () => {
    expect(gfs.isInitialized()).toBe(false);

    await gfs.initGlobalStructure();
    expect(gfs.isInitialized()).toBe(true);

    // Verify folders
    expect(gfs.exists(gfs.resolve('profile'))).toBe(true);
    expect(gfs.exists(gfs.resolve('devices'))).toBe(true);
    expect(gfs.exists(gfs.resolve('toolchain'))).toBe(true);
    expect(gfs.exists(gfs.resolve('accounts'))).toBe(true);
    expect(gfs.exists(gfs.resolve('projects'))).toBe(true);
    expect(gfs.exists(gfs.resolve('knowledge', 'ai'))).toBe(true);
    expect(gfs.exists(gfs.resolve('knowledge', 'architecture'))).toBe(true);

    // Verify files
    const config = await gfs.readYaml<any>(gfs.resolve('config.yml'));
    expect(config.defaultPackageManager).toBe('pnpm');

    const devProfile = await gfs.readFile(gfs.resolve('profile', 'developer.md'));
    expect(devProfile).toContain('Developer Profile');

    const registry = await gfs.readYaml<any>(gfs.resolve('projects', 'registry.yml'));
    expect(registry.projects).toEqual([]);
  });
});
