import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { FileSystem } from '../../src/core/storage/file-system.js';
import { PlanManager } from '../../src/core/engine/plan-manager.js';

describe('PlanManager', () => {
  let tmpDir: string;
  let fileSystem: FileSystem;
  let planManager: PlanManager;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'continuity-plan-test-'));
    fileSystem = new FileSystem(tmpDir);
    planManager = new PlanManager(fileSystem);
    await fileSystem.ensureDir(fileSystem.continuityDir);
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('manages plan lifecycle across active, blocked, and completed states', async () => {
    // 1. Create plan
    const plan = await planManager.createPlan({
      title: 'Payment Refactor',
      goal: 'Separate payment orchestration from transport concerns',
      scope: ['src/payment/service.ts', 'src/payment/repository.ts'],
      steps: [
        { description: 'Extract payment service' },
        { description: 'Extract payment repository' },
        { description: 'Introduce transaction boundary' }
      ],
      constraints: ['Do not change public API', 'No database migration'],
      acceptanceCriteria: [
        'Payment retry is idempotent',
        'No duplicate payment records'
      ]
    });

    expect(plan.id).toBe('payment-refactor');
    expect(plan.status).toBe('active');
    expect(plan.steps.length).toBe(3);
    expect(plan.steps[0].status).toBe('in_progress');
    expect(plan.currentStep).toBe('Extract payment service');

    // 2. Update step 1 completed
    const updated = await planManager.updatePlan(plan.id, {
      completeStepIndex: 0,
      addCommitsToStep: { stepIndex: 0, commits: ['a81d92e'] },
      satisfyCriterionIndex: 0
    });

    expect(updated.steps[0].status).toBe('completed');
    expect(updated.steps[0].commits).toContain('a81d92e');
    expect(updated.steps[1].status).toBe('in_progress');
    expect(updated.currentStep).toBe('Extract payment repository');
    expect(updated.acceptanceCriteria[0].satisfied).toBe(true);

    // 3. Block plan
    const blocked = await planManager.blockPlan(plan.id, 'Waiting for upstream banking API docs');
    expect(blocked.status).toBe('blocked');
    expect(blocked.abandonReason).toContain('upstream banking API');

    // 4. Complete plan
    const completed = await planManager.completePlan(plan.id);
    expect(completed.status).toBe('completed');
    expect(completed.steps.every((s) => s.status === 'completed')).toBe(true);
    expect(completed.acceptanceCriteria.every((c) => c.satisfied)).toBe(true);

    const list = await planManager.listPlans();
    expect(list.completed.length).toBe(1);
    expect(list.active.length).toBe(0);
  });
});
