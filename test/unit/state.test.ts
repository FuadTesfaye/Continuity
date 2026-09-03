import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { FileSystem } from '../../src/core/storage/file-system.js';
import { StateManager } from '../../src/core/engine/state-manager.js';

describe('StateManager', () => {
  let tmpDir: string;
  let fileSystem: FileSystem;
  let stateManager: StateManager;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'continuity-state-test-'));
    fileSystem = new FileSystem(tmpDir);
    stateManager = new StateManager(fileSystem);
    await fileSystem.ensureDir(fileSystem.continuityDir);
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('saves and parses state.md correctly', async () => {
    await stateManager.saveState({
      project: 'Acme Platform',
      currentBranch: 'feature/auth-refresh',
      currentTask: 'Implement refresh token rotation',
      status: 'In progress — 80%',
      progress: 80,
      completed: ['Login endpoint', 'JWT access tokens'],
      remaining: ['Refresh token rotation', 'Integration tests'],
      currentFiles: ['src/auth/refresh.ts'],
      currentBlocker: 'Transaction handling',
      lastAction: 'Implemented refresh token invalidation',
      nextAction: {
        file: 'src/auth/refresh.ts',
        focus: 'refreshToken()',
        problem: 'Token replacement is not atomic',
        expectedSolution: 'Wrap both operations in a database transaction',
        constraints: ['Do not change auth architecture']
      }
    });

    const parsed = await stateManager.getState();
    expect(parsed.project).toBe('Acme Platform');
    expect(parsed.currentBranch).toBe('feature/auth-refresh');
    expect(parsed.currentTask).toBe('Implement refresh token rotation');
    expect(parsed.progress).toBe(80);
    expect(parsed.completed).toContain('Login endpoint');
    expect(parsed.remaining).toContain('Refresh token rotation');
    expect(parsed.currentFiles).toContain('src/auth/refresh.ts');
    expect(parsed.currentBlocker).toBe('Transaction handling');

    if (typeof parsed.nextAction === 'object') {
      expect(parsed.nextAction.file).toBe('src/auth/refresh.ts');
      expect(parsed.nextAction.focus).toBe('refreshToken()');
      expect(parsed.nextAction.problem).toContain('atomic');
      expect(parsed.nextAction.expectedSolution).toContain('database transaction');
    } else {
      throw new Error('nextAction should be an object');
    }
  });
});
