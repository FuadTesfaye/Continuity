import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { PlanManager } from '../engine/plan-manager.js';
import { GitClient } from '../git/git-client.js';
import { FileSystem } from '../storage/file-system.js';
import { Plan } from '../types/plan.js';

const execFileAsync = promisify(execFile);

export interface VerificationReport {
  plan?: Plan;
  status: 'READY_FOR_HANDOVER' | 'IN_PROGRESS' | 'BLOCKED';
  stepsTotal: number;
  stepsCompleted: number;
  criteriaTotal: number;
  criteriaSatisfied: number;
  uncommittedFilesCount: number;
  testsPassed?: boolean;
  testOutput?: string;
  checks: Array<{
    name: string;
    passed: boolean;
    message: string;
    warning?: boolean;
  }>;
  nextRecommendedAction: string;
}

export class VerificationEngine {
  constructor(
    private readonly planManager: PlanManager,
    private readonly git: GitClient,
    private readonly fs: FileSystem
  ) {}

  async verify(planId?: string, runTests = false): Promise<VerificationReport> {
    const checks: VerificationReport['checks'] = [];

    // 1. Get Plan
    const plan = planId ? await this.planManager.getPlan(planId) : await this.planManager.getActivePlan();

    let stepsTotal = 0;
    let stepsCompleted = 0;
    let criteriaTotal = 0;
    let criteriaSatisfied = 0;

    if (plan) {
      stepsTotal = plan.steps.length;
      stepsCompleted = plan.steps.filter((s) => s.status === 'completed').length;
      criteriaTotal = plan.acceptanceCriteria.length;
      criteriaSatisfied = plan.acceptanceCriteria.filter((c) => c.satisfied).length;

      checks.push({
        name: 'Plan Steps Progress',
        passed: stepsCompleted === stepsTotal,
        message: `${stepsCompleted}/${stepsTotal} planned steps completed`,
        warning: stepsCompleted < stepsTotal
      });

      checks.push({
        name: 'Acceptance Criteria',
        passed: criteriaSatisfied === criteriaTotal,
        message: `${criteriaSatisfied}/${criteriaTotal} criteria satisfied`,
        warning: criteriaSatisfied < criteriaTotal
      });
    } else {
      checks.push({
        name: 'Active Plan',
        passed: false,
        message: 'No active plan found. Run "continuity plan create" to establish a plan.',
        warning: true
      });
    }

    // 2. Git Status Check
    const gitStatus = await this.git.getStatus();
    const uncommittedFilesCount = gitStatus.modifiedFiles.length + gitStatus.stagedFiles.length;

    checks.push({
      name: 'Working Tree State',
      passed: uncommittedFilesCount === 0,
      message:
        uncommittedFilesCount === 0
          ? 'Working tree is clean'
          : `${uncommittedFilesCount} uncommitted file(s) detected`,
      warning: uncommittedFilesCount > 0
    });

    // 3. Optional Automated Tests
    let testsPassed: boolean | undefined;
    let testOutput: string | undefined;

    if (runTests) {
      const pkgPath = this.fs.resolve('package.json');
      if (this.fs.exists(pkgPath)) {
        try {
          const pkg = JSON.parse(await this.fs.readFile(pkgPath));
          if (pkg.scripts && pkg.scripts.test) {
            try {
              const { stdout } = await execFileAsync('npm', ['test'], { cwd: this.fs.rootDir });
              testsPassed = true;
              testOutput = stdout.slice(-300);
            } catch (err: any) {
              testsPassed = false;
              testOutput = (err.stdout || err.message || '').slice(-300);
            }

            checks.push({
              name: 'Automated Test Suite',
              passed: testsPassed === true,
              message: testsPassed ? 'All automated tests passed' : 'Test suite failed execution'
            });
          }
        } catch {}
      }
    }

    // Determine overall status
    let status: VerificationReport['status'] = 'IN_PROGRESS';
    let nextRecommendedAction = '';

    if (plan && plan.status === 'blocked') {
      status = 'BLOCKED';
      nextRecommendedAction = `Resolve blocker: ${plan.abandonReason || 'external dependency'}`;
    } else if (
      plan &&
      stepsCompleted === stepsTotal &&
      criteriaSatisfied === criteriaTotal &&
      (testsPassed === undefined || testsPassed === true)
    ) {
      status = 'READY_FOR_HANDOVER';
      nextRecommendedAction =
        uncommittedFilesCount > 0
          ? 'Commit remaining changes and run "continuity handover"'
          : 'Run "continuity handover" to package completed work';
    } else {
      status = 'IN_PROGRESS';
      const pendingStep = plan?.steps.find((s) => s.status !== 'completed');
      nextRecommendedAction = pendingStep
        ? `Work on step: ${pendingStep.description}`
        : 'Continue implementation of active task';
    }

    return {
      plan,
      status,
      stepsTotal,
      stepsCompleted,
      criteriaTotal,
      criteriaSatisfied,
      uncommittedFilesCount,
      testsPassed,
      testOutput,
      checks,
      nextRecommendedAction
    };
  }
}
