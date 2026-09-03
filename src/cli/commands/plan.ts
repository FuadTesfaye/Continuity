import { FileSystem } from '../../core/storage/file-system.js';
import { PlanManager } from '../../core/engine/plan-manager.js';
import { TerminalFormatter } from '../formatters/terminal.js';
import { PlanStatus } from '../../core/types/plan.js';

export interface PlanCreateOptions {
  goal?: string;
  scope?: string;
  steps?: string;
  constraints?: string;
  criteria?: string;
}

export async function runPlanCreate(title: string, options: PlanCreateOptions = {}): Promise<void> {
  const fs = new FileSystem();
  if (!fs.isInitialized()) {
    TerminalFormatter.error("Continuity is not initialized. Run 'continuity init' first.");
    process.exitCode = 1;
    return;
  }

  const planManager = new PlanManager(fs);

  const goal = options.goal || `Implement and deliver ${title}`;
  const scope = options.scope ? options.scope.split(',').map((s) => s.trim()) : [];
  const stepItems = options.steps
    ? options.steps.split(',').map((s) => ({ description: s.trim() }))
    : [
        { description: 'Design architecture and requirements' },
        { description: 'Implement core functionality' },
        { description: 'Write tests and verify' }
      ];
  const constraints = options.constraints ? options.constraints.split(',').map((s) => s.trim()) : [];
  const acceptanceCriteria = options.criteria ? options.criteria.split(',').map((s) => s.trim()) : [];

  const plan = await planManager.createPlan({
    title,
    goal,
    scope,
    steps: stepItems,
    constraints,
    acceptanceCriteria
  });

  TerminalFormatter.success(`Plan created: "${plan.title}" (id: ${plan.id})`);
  TerminalFormatter.item('Status', plan.status.toUpperCase());
  TerminalFormatter.item('Goal', plan.goal);
  TerminalFormatter.item('Steps', plan.steps.length);
  TerminalFormatter.item('Current Step', plan.currentStep);
  TerminalFormatter.info(`Stored in .continuity/plans/active/${plan.id}.md`);
}

export async function runPlanList(): Promise<void> {
  const fs = new FileSystem();
  if (!fs.isInitialized()) {
    TerminalFormatter.error("Continuity is not initialized. Run 'continuity init' first.");
    process.exitCode = 1;
    return;
  }

  const planManager = new PlanManager(fs);
  const plans = await planManager.listPlans();

  TerminalFormatter.header('Continuity Plans');

  console.log(`\nACTIVE (${plans.active.length}):`);
  if (plans.active.length === 0) console.log('  None');
  for (const p of plans.active) {
    const completedSteps = p.steps.filter((s) => s.status === 'completed').length;
    const pct = p.steps.length > 0 ? Math.round((completedSteps / p.steps.length) * 100) : 0;
    console.log(`  • [${pct}%] ${p.title} (id: ${p.id})`);
    console.log(`    Current: ${p.currentStep || 'None'}`);
  }

  console.log(`\nBLOCKED (${plans.blocked.length}):`);
  if (plans.blocked.length === 0) console.log('  None');
  for (const p of plans.blocked) {
    console.log(`  • ${p.title} (Reason: ${p.abandonReason || 'unspecified'})`);
  }

  console.log(`\nCOMPLETED (${plans.completed.length}):`);
  if (plans.completed.length === 0) console.log('  None');
  for (const p of plans.completed) {
    console.log(`  ✓ ${p.title} (completed: ${p.completedAt?.split('T')[0]})`);
  }

  console.log(`\nABANDONED (${plans.abandoned.length}):`);
  if (plans.abandoned.length === 0) console.log('  None');
  for (const p of plans.abandoned) {
    console.log(`  ✗ ${p.title} (Reason: ${p.abandonReason || 'unspecified'})`);
  }
}

export async function runPlanShow(id: string): Promise<void> {
  const fs = new FileSystem();
  if (!fs.isInitialized()) {
    TerminalFormatter.error("Continuity is not initialized. Run 'continuity init' first.");
    process.exitCode = 1;
    return;
  }

  const planManager = new PlanManager(fs);
  const plan = await planManager.getPlan(id);

  if (!plan) {
    TerminalFormatter.error(`Plan '${id}' not found.`);
    process.exitCode = 1;
    return;
  }

  TerminalFormatter.header(`Plan: ${plan.title} [${plan.status.toUpperCase()}]`);
  TerminalFormatter.item('Goal', plan.goal);
  TerminalFormatter.item('Current Step', plan.currentStep);
  TerminalFormatter.item('Next Step', plan.nextStep);

  TerminalFormatter.section('STEPS');
  for (let i = 0; i < plan.steps.length; i++) {
    const s = plan.steps[i];
    const mark = s.status === 'completed' ? '✓' : s.status === 'in_progress' ? '▶' : '□';
    console.log(`  ${mark} [${i + 1}] ${s.description} (${s.status})`);
    if (s.commits.length > 0) console.log(`      Commits: ${s.commits.join(', ')}`);
  }

  if (plan.acceptanceCriteria.length > 0) {
    TerminalFormatter.section('ACCEPTANCE CRITERIA');
    for (let i = 0; i < plan.acceptanceCriteria.length; i++) {
      const c = plan.acceptanceCriteria[i];
      console.log(`  ${c.satisfied ? '✓' : '□'} [${i + 1}] ${c.description}`);
    }
  }

  if (plan.constraints.length > 0) {
    TerminalFormatter.section('CONSTRAINTS');
    for (const c of plan.constraints) {
      console.log(`  * ${c}`);
    }
  }
}

export interface PlanUpdateOptions {
  completeStep?: string;
  satisfyCriterion?: string;
  status?: string;
  block?: string;
  abandon?: string;
  stepName?: string;
}

export async function runPlanUpdate(id: string, options: PlanUpdateOptions = {}): Promise<void> {
  const fs = new FileSystem();
  if (!fs.isInitialized()) {
    TerminalFormatter.error("Continuity is not initialized. Run 'continuity init' first.");
    process.exitCode = 1;
    return;
  }

  const planManager = new PlanManager(fs);

  let completeStepIndex: number | undefined;
  if (options.completeStep !== undefined) {
    completeStepIndex = parseInt(options.completeStep, 10) - 1;
  }

  let satisfyCriterionIndex: number | undefined;
  if (options.satisfyCriterion !== undefined) {
    satisfyCriterionIndex = parseInt(options.satisfyCriterion, 10) - 1;
  }

  const updated = await planManager.updatePlan(id, {
    completeStepIndex,
    satisfyCriterionIndex,
    status: (options.status as PlanStatus) || (options.block ? 'blocked' : options.abandon ? 'abandoned' : undefined),
    currentStep: options.stepName,
    abandonReason: options.block || options.abandon
  });

  TerminalFormatter.success(`Plan updated: "${updated.title}"`);
  TerminalFormatter.item('Status', updated.status.toUpperCase());
  TerminalFormatter.item('Current Step', updated.currentStep);
  TerminalFormatter.item('Next Step', updated.nextStep);
}
