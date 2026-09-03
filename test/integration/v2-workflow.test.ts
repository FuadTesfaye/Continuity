import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { FileSystem } from '../../src/core/storage/file-system.js';
import { GitClient } from '../../src/core/git/git-client.js';
import { StateManager } from '../../src/core/engine/state-manager.js';
import { TaskManager } from '../../src/core/engine/task-manager.js';
import { PlanManager } from '../../src/core/engine/plan-manager.js';
import { DecisionManager } from '../../src/core/engine/decision-manager.js';
import { FailureManager } from '../../src/core/engine/failure-manager.js';
import { SessionManager } from '../../src/core/engine/session-manager.js';
import { HandoverManager } from '../../src/core/engine/handover-manager.js';
import { ResumeEngine } from '../../src/core/engine/resume-engine.js';
import { VerificationEngine } from '../../src/core/verify/verification-engine.js';

const execFileAsync = promisify(execFile);

describe('Continuity v2 End-to-End Cross-Agent Workflow', () => {
  let tmpDir: string;
  let fileSystem: FileSystem;
  let git: GitClient;
  let stateManager: StateManager;
  let taskManager: TaskManager;
  let planManager: PlanManager;
  let decisionManager: DecisionManager;
  let failureManager: FailureManager;
  let sessionManager: SessionManager;
  let handoverManager: HandoverManager;
  let resumeEngine: ResumeEngine;
  let verificationEngine: VerificationEngine;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'continuity-v2-integration-'));
    fileSystem = new FileSystem(tmpDir);
    git = new GitClient(tmpDir);

    // Initialize git repository
    await execFileAsync('git', ['init'], { cwd: tmpDir });
    await execFileAsync('git', ['branch', '-M', 'main'], { cwd: tmpDir });
    await execFileAsync('git', ['config', 'user.name', 'Claude'], { cwd: tmpDir });
    await execFileAsync('git', ['config', 'user.email', 'claude@anthropic.com'], { cwd: tmpDir });

    await fileSystem.ensureDir(fileSystem.continuityDir);
    stateManager = new StateManager(fileSystem);
    taskManager = new TaskManager(fileSystem, stateManager);
    planManager = new PlanManager(fileSystem);
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
      git,
      planManager
    );
    verificationEngine = new VerificationEngine(planManager, git, fileSystem);
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('coordinates work between Agent 1 (Claude) and Agent 2 (Cursor) with Plans, Git, and Verification', async () => {
    // -------------------------------------------------------------
    // Phase 1: Agent 1 (Claude) initiates project & architectural plan
    // -------------------------------------------------------------
    await stateManager.saveProjectInfo({
      name: 'Procurement Engine',
      purpose: 'Enterprise purchasing workflows',
      stack: ['Node.js', 'TypeScript', 'SQLite'],
      architecture: 'Clean Architecture with Ports and Adapters'
    });

    const plan = await planManager.createPlan({
      title: 'Payment Integration',
      goal: 'Integrate payment processing with retry policies',
      steps: [
        { description: 'Implement PaymentService abstraction' },
        { description: 'Add Idempotent RetryPolicy' }
      ],
      constraints: ['Must use exponential backoff', 'No plaintext credentials'],
      acceptanceCriteria: ['Payment retry is idempotent', 'Transactions rollback cleanly']
    });

    const task = await taskManager.startTask('Payment Integration Service', {
      description: 'Implement first step of payment plan',
      remaining: ['Implement PaymentService abstraction', 'Add Idempotent RetryPolicy'],
      planId: plan.id
    });

    // Agent 1 writes code
    const srcDir = path.join(tmpDir, 'src', 'payment');
    await fs.mkdir(srcDir, { recursive: true });
    await fs.writeFile(path.join(srcDir, 'service.ts'), 'export class PaymentService {}\n');

    // Agent 1 commits code to git
    await execFileAsync('git', ['add', '.'], { cwd: tmpDir });
    await execFileAsync('git', ['commit', '-m', 'feat: implement initial PaymentService skeleton'], { cwd: tmpDir });

    // Agent 1 updates plan and task
    await planManager.updatePlan(plan.id, {
      completeStepIndex: 0,
      addCommitsToStep: { stepIndex: 0, commits: ['feat: initial skeleton'] },
      satisfyCriterionIndex: 0
    });

    await decisionManager.recordDecision({
      title: 'Payment Service Atomicity',
      decision: 'All operations inside PaymentService must execute in single transaction',
      why: 'Avoid partial payment debits',
      status: 'accepted'
    });

    await failureManager.recordFailure({
      title: 'In-memory locking',
      attempt: 'Used in-memory mutex for payment requests',
      result: 'Failed in multi-instance environment',
      why: 'Node instances do not share memory',
      doNotRepeat: 'Do not use local mutexes for distributed transactions',
      betterApproach: 'Use database row-level locking'
    });

    // Agent 1 checks verification status
    const intermediateReport = await verificationEngine.verify(plan.id);
    expect(intermediateReport.status).toBe('IN_PROGRESS');
    expect(intermediateReport.stepsCompleted).toBe(1);

    // Agent 1 generates Handover
    const handover = await handoverManager.createHandover({
      currentTask: task.title,
      progress: 50,
      completed: ['Implement PaymentService abstraction'],
      remaining: ['Add Idempotent RetryPolicy'],
      planId: plan.id,
      planStep: 'Add Idempotent RetryPolicy',
      nextAction: {
        file: 'src/payment/retry.ts',
        focus: 'RetryPolicy class implementation',
        problem: 'Retry logic missing',
        expectedSolution: 'Implement retry policy with exponential backoff',
        constraints: ['Must use exponential backoff']
      },
      author: 'Claude'
    });

    expect(handover.id).toBeDefined();

    // -------------------------------------------------------------
    // Phase 2: Agent 2 (Cursor) resumes the project
    // -------------------------------------------------------------
    const resumeContext = await resumeEngine.buildContext();

    expect(resumeContext.project).toBe('Procurement Engine');
    expect(resumeContext.plan?.title).toBe('Payment Integration');
    expect(resumeContext.plan?.progressPercentage).toBe(50);
    expect(resumeContext.plan?.currentStep).toBe('Add Idempotent RetryPolicy');
    expect(resumeContext.recentCommits.length).toBeGreaterThan(0);
    expect(resumeContext.recentDecisions.length).toBeGreaterThan(0);
    expect(resumeContext.previousFailedApproaches.length).toBeGreaterThan(0);
    expect(resumeContext.nextAction.file).toBe('src/payment/retry.ts');

    // Agent 2 implements remaining step
    await fs.writeFile(path.join(srcDir, 'retry.ts'), 'export class RetryPolicy {}\n');
    await execFileAsync('git', ['add', '.'], { cwd: tmpDir });
    await execFileAsync('git', ['commit', '-m', 'feat: implement Idempotent RetryPolicy'], { cwd: tmpDir });

    // Agent 2 updates plan
    await planManager.updatePlan(plan.id, {
      completeStepIndex: 1,
      satisfyCriterionIndex: 1
    });

    // Final verification
    const finalReport = await verificationEngine.verify(plan.id);
    expect(finalReport.status).toBe('READY_FOR_HANDOVER');
    expect(finalReport.stepsCompleted).toBe(2);
    expect(finalReport.criteriaSatisfied).toBe(2);

    // Complete plan
    const completedPlan = await planManager.completePlan(plan.id);
    expect(completedPlan.status).toBe('completed');
  });
});
