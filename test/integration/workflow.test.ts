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
import { DoctorEngine } from '../../src/core/engine/doctor-engine.js';
import { runInit } from '../../src/cli/commands/init.js';

describe('Cross-Agent Continuity Lifecycle', () => {
  let tmpDir: string;
  const originalCwd = process.cwd();

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'continuity-e2e-test-'));
    process.chdir(tmpDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('enables seamless handover and continuation between different AI agents', async () => {
    // 1. Initialization (Human / Lead AI)
    await runInit({ name: 'Procurement System', description: 'Enterprise Procurement Platform', withAgents: true });

    const fileSystem = new FileSystem(tmpDir);
    expect(fileSystem.exists(path.join(tmpDir, 'CONTINUITY.md'))).toBe(true);
    expect(fileSystem.exists(path.join(tmpDir, '.continuity', 'state.md'))).toBe(true);
    expect(fileSystem.exists(path.join(tmpDir, 'skills', 'continuity', 'SKILL.md'))).toBe(true);
    expect(fileSystem.exists(path.join(tmpDir, '.cursor', 'rules', 'continuity.mdc'))).toBe(true);
    expect(fileSystem.exists(path.join(tmpDir, 'CLAUDE.md'))).toBe(true);

    const git = new GitClient(tmpDir);
    const stateManager = new StateManager(fileSystem);
    const taskManager = new TaskManager(fileSystem, stateManager);
    const decisionManager = new DecisionManager(fileSystem);
    const failureManager = new FailureManager(fileSystem);
    const sessionManager = new SessionManager(fileSystem, stateManager);
    const handoverManager = new HandoverManager(fileSystem, git, stateManager, decisionManager, failureManager);
    const resumeEngine = new ResumeEngine(stateManager, handoverManager, sessionManager, failureManager, decisionManager, git);

    // 2. Agent 1 (e.g. Claude) starts work
    const task = await taskManager.startTask('Implement refresh-token rotation', {
      description: 'Rotate JWT refresh tokens securely',
      remaining: ['Endpoint', 'Transaction wrapper', 'Tests'],
      relatedFiles: ['src/auth/refresh.ts']
    });

    await taskManager.updateTask(task.id, {
      progress: 50,
      addCompleted: ['Endpoint'],
      removeRemaining: ['Endpoint']
    });

    await decisionManager.recordDecision({
      title: 'Database-backed tokens',
      decision: 'Store refresh token invalidations in PostgreSQL rather than Redis',
      why: 'Simpler transaction consistency with user state'
    });

    await sessionManager.saveSession({
      agent: 'claude',
      objective: 'Implement initial refresh token endpoint',
      workCompleted: ['Created refresh endpoint', 'Token validation'],
      filesChanged: ['src/auth/refresh.ts'],
      gitCommit: '91da82f'
    });

    // Agent 1 hands over
    await handoverManager.createHandover({
      currentTask: 'Implement refresh-token rotation',
      progress: 75,
      completed: ['Login', 'Refresh endpoint', 'Token validation'],
      remaining: ['Transaction boundaries', 'Concurrency test'],
      nextAction: {
        file: 'src/auth/refresh.ts',
        focus: 'refreshToken()',
        problem: 'Token replacement is not atomic under concurrency',
        expectedSolution: 'Wrap invalidation and creation in transaction block',
        constraints: ['Do not change auth architecture']
      },
      author: 'claude'
    });

    // 3. Agent 2 (e.g. Cursor or Antigravity) resumes
    const resumeContext = await resumeEngine.buildContext();
    expect(resumeContext.currentTask).toBe('Implement refresh-token rotation');
    expect(resumeContext.progress).toBe(75);
    expect(resumeContext.nextAction.file).toBe('src/auth/refresh.ts');
    expect(resumeContext.nextAction.focus).toBe('refreshToken()');

    // Agent 2 attempts manual rollback, notes failure
    await failureManager.recordFailure({
      title: 'Manual Rollback',
      attempt: 'Manual rollback on token creation failure',
      result: 'Race condition',
      why: 'Concurrent request can read half-committed state',
      doNotRepeat: 'Do not use application-level manual rollback',
      betterApproach: 'Wrap in db.transaction()'
    });

    // Agent 2 wraps in db.transaction() and completes task
    await taskManager.completeTask(task.id, 'Transaction wrapper complete with atomic rotation');

    const state = await stateManager.getState();
    expect(state.progress).toBe(100);

    // 4. Run Doctor Diagnostics
    const doctor = new DoctorEngine(fileSystem, git, stateManager, taskManager);
    const report = await doctor.runDiagnostics();
    expect(report.overallHealthy).toBe(true);
  });
});
