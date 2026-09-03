import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { FileSystem } from '../../src/core/storage/file-system.js';
import { GitClient } from '../../src/core/git/git-client.js';
import { StateManager } from '../../src/core/engine/state-manager.js';
import { TaskManager } from '../../src/core/engine/task-manager.js';
import { DecisionManager } from '../../src/core/engine/decision-manager.js';
import { FailureManager } from '../../src/core/engine/failure-manager.js';
import { SessionManager } from '../../src/core/engine/session-manager.js';
import { HandoverManager } from '../../src/core/engine/handover-manager.js';
import { ResumeEngine } from '../../src/core/engine/resume-engine.js';

describe('ResumeEngine', () => {
  let tmpDir: string;
  let fileSystem: FileSystem;
  let git: GitClient;
  let stateManager: StateManager;
  let taskManager: TaskManager;
  let decisionManager: DecisionManager;
  let failureManager: FailureManager;
  let sessionManager: SessionManager;
  let handoverManager: HandoverManager;
  let resumeEngine: ResumeEngine;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'continuity-resume-test-'));
    fileSystem = new FileSystem(tmpDir);
    git = new GitClient(tmpDir);
    stateManager = new StateManager(fileSystem);
    taskManager = new TaskManager(fileSystem, stateManager);
    decisionManager = new DecisionManager(fileSystem);
    failureManager = new FailureManager(fileSystem);
    sessionManager = new SessionManager(fileSystem, stateManager);
    handoverManager = new HandoverManager(fileSystem, git, stateManager, decisionManager, failureManager);

    resumeEngine = new ResumeEngine(
      stateManager,
      handoverManager,
      sessionManager,
      failureManager,
      decisionManager,
      git
    );

    await fileSystem.ensureDir(fileSystem.continuityDir);

    // Seed state.md
    await stateManager.saveState({
      project: 'Procurement Management System',
      currentBranch: 'feature/auth-refresh',
      currentTask: 'Refresh token rotation',
      status: 'In progress — 82%',
      progress: 82,
      completed: ['Login', 'Token validation', 'Refresh endpoint'],
      remaining: ['Transaction-safe token rotation', 'Integration tests'],
      currentFiles: ['src/auth/refresh.ts', 'src/auth/token.service.ts'],
      currentBlocker: 'Transaction boundaries',
      lastAction: 'Implemented refresh token invalidation',
      nextAction: {
        file: 'src/auth/refresh.ts',
        focus: 'refreshToken()',
        problem: 'Token replacement is not atomic',
        expectedSolution: 'Wrap token invalidation and token creation inside the existing transaction wrapper',
        constraints: ['Do NOT redesign authentication']
      }
    });

    // Seed failure
    await failureManager.recordFailure({
      title: 'Manual Rollback',
      attempt: 'Manual rollback on token creation error',
      result: 'Inconsistent token state under concurrent requests',
      why: 'No transactional guarantee',
      doNotRepeat: 'Do not use manual rollbacks for token replacement',
      betterApproach: 'Use transaction wrapper'
    });
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('compiles prioritized compact resume payload', async () => {
    const ctx = await resumeEngine.buildContext();
    expect(ctx.project).toBe('Procurement Management System');
    expect(ctx.currentTask).toBe('Refresh token rotation');
    expect(ctx.progress).toBe(82);
    expect(ctx.currentBlocker).toBe('Transaction boundaries');
    expect(ctx.relevantFiles).toContain('src/auth/refresh.ts');
    expect(ctx.previousFailedApproaches.length).toBeGreaterThan(0);
    expect(ctx.nextAction.problem).toContain('not atomic');

    const compact = resumeEngine.formatCompact(ctx);
    expect(compact).toContain('CONTINUITY RESUME');
    expect(compact).toContain('Procurement Management System');
    expect(compact).toContain('Refresh token rotation [82% completed]');
    expect(compact).toContain('DO NOT REPEAT (FAILED APPROACHES)');
    expect(compact).toContain('RECOMMENDED NEXT ACTION');
    expect(compact).toContain('Open: src/auth/refresh.ts');
    expect(compact).toContain('Do NOT redesign authentication');
  });
});
