import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { FileSystem } from '../../src/core/storage/file-system.js';
import { PlanManager } from '../../src/core/engine/plan-manager.js';
import { GitClient } from '../../src/core/git/git-client.js';
import { VerificationEngine } from '../../src/core/verify/verification-engine.js';

describe('VerificationEngine', () => {
  let tmpDir: string;
  let fileSystem: FileSystem;
  let planManager: PlanManager;
  let git: GitClient;
  let verifier: VerificationEngine;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'continuity-verify-test-'));
    fileSystem = new FileSystem(tmpDir);
    planManager = new PlanManager(fileSystem);
    git = new GitClient(tmpDir);
    verifier = new VerificationEngine(planManager, git, fileSystem);
    await fileSystem.ensureDir(fileSystem.continuityDir);
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('evaluates incomplete plan as IN_PROGRESS and completed plan as READY_FOR_HANDOVER', async () => {
    const plan = await planManager.createPlan({
      title: 'Auth Flow',
      goal: 'Implement JWT authentication',
      steps: [{ description: 'JWT middleware' }, { description: 'Refresh tokens' }],
      acceptanceCriteria: ['Tokens expire in 15m', 'Rotation prevents replay']
    });

    // Initial state: IN_PROGRESS
    const report1 = await verifier.verify(plan.id);
    expect(report1.status).toBe('IN_PROGRESS');
    expect(report1.stepsCompleted).toBe(0);
    expect(report1.criteriaSatisfied).toBe(0);

    // Complete all steps and satisfy criteria
    await planManager.updatePlan(plan.id, {
      completeStepIndex: 0,
      satisfyCriterionIndex: 0
    });
    await planManager.updatePlan(plan.id, {
      completeStepIndex: 1,
      satisfyCriterionIndex: 1
    });

    const report2 = await verifier.verify(plan.id);
    expect(report2.status).toBe('READY_FOR_HANDOVER');
    expect(report2.stepsCompleted).toBe(2);
    expect(report2.criteriaSatisfied).toBe(2);
    expect(report2.nextRecommendedAction).toContain('handover');
  });
});
