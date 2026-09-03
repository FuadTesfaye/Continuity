import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { FileSystem } from '../../src/core/storage/file-system.js';
import { FailureManager } from '../../src/core/engine/failure-manager.js';

describe('FailureManager', () => {
  let tmpDir: string;
  let fileSystem: FileSystem;
  let failureManager: FailureManager;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'continuity-failure-test-'));
    fileSystem = new FileSystem(tmpDir);
    failureManager = new FailureManager(fileSystem);
    await fileSystem.ensureDir(fileSystem.continuityDir);
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('records failed approaches with "Do Not Repeat" lessons', async () => {
    const failure = await failureManager.recordFailure({
      title: 'Manual Rollback on Refresh Token',
      attempt: 'Manual rollback after token invalidation',
      result: 'Failed with race condition under high concurrency',
      why: 'Database state became inconsistent across requests',
      doNotRepeat: 'Do not use application-level manual rollbacks for token rotation',
      betterApproach: 'Use an atomic database transaction boundary',
      relatedFiles: ['src/auth/refresh.ts']
    });

    expect(failure.title).toBe('Manual Rollback on Refresh Token');
    expect(failure.doNotRepeat).toContain('Do not use application-level manual rollbacks');
    expect(failure.betterApproach).toContain('database transaction boundary');

    const list = await failureManager.listFailures();
    expect(list.length).toBe(1);
    expect(list[0].id).toBe(failure.id);
  });
});
