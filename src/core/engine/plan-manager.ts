import path from 'node:path';
import { Plan, PlanSchema, PlanStatus, PlanStep, AcceptanceCriterion } from '../types/plan.js';
import { FileSystem } from '../storage/file-system.js';
import { MarkdownHelper } from '../storage/markdown.js';

export class PlanManager {
  constructor(private readonly fs: FileSystem) {}

  private get plansDir(): string {
    return this.fs.resolveContinuity('plans');
  }

  private slugify(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
  }

  private getPlanDir(status: PlanStatus): string {
    return path.join(this.plansDir, status);
  }

  async createPlan(data: {
    title: string;
    goal: string;
    scope?: string[];
    steps: Array<{ description: string; files?: string[] }>;
    constraints?: string[];
    dependencies?: string[];
    acceptanceCriteria?: string[];
  }): Promise<Plan> {
    await this.fs.ensureDir(path.join(this.plansDir, 'active'));
    await this.fs.ensureDir(path.join(this.plansDir, 'blocked'));
    await this.fs.ensureDir(path.join(this.plansDir, 'completed'));
    await this.fs.ensureDir(path.join(this.plansDir, 'abandoned'));

    const id = this.slugify(data.title);
    const now = new Date().toISOString();

    const steps: PlanStep[] = data.steps.map((s, index) => ({
      id: `step-${index + 1}`,
      description: s.description,
      status: index === 0 ? 'in_progress' : 'pending',
      commits: [],
      files: s.files || []
    }));

    const acceptanceCriteria: AcceptanceCriterion[] = (data.acceptanceCriteria || []).map((ac, index) => ({
      id: `crit-${index + 1}`,
      description: ac,
      satisfied: false
    }));

    const plan: Plan = {
      id,
      title: data.title,
      status: 'active',
      goal: data.goal,
      scope: data.scope || [],
      steps,
      constraints: data.constraints || [],
      dependencies: data.dependencies || [],
      acceptanceCriteria,
      currentStep: steps.length > 0 ? steps[0].description : undefined,
      nextStep: steps.length > 1 ? steps[1].description : undefined,
      createdAt: now,
      updatedAt: now
    };

    const validated = PlanSchema.parse(plan);
    await this.savePlanFile(validated);
    return validated;
  }

  async getPlan(id: string): Promise<Plan | undefined> {
    const statuses: PlanStatus[] = ['active', 'blocked', 'completed', 'abandoned', 'planned'];
    for (const status of statuses) {
      const planPath = path.join(this.getPlanDir(status), `${id}.md`);
      if (this.fs.exists(planPath)) {
        const raw = await this.fs.readFile(planPath);
        return this.parsePlanMarkdown(raw, id, status);
      }
    }
    return undefined;
  }

  async getActivePlan(): Promise<Plan | undefined> {
    const activeDir = this.getPlanDir('active');
    if (!this.fs.exists(activeDir)) return undefined;
    const files = await this.fs.listFiles(activeDir, '.md');
    if (files.length === 0) return undefined;

    // Pick most recently modified active plan
    const raw = await this.fs.readFile(files[0]);
    return this.parsePlanMarkdown(raw, path.basename(files[0], '.md'), 'active');
  }

  async updatePlan(
    id: string,
    updates: {
      status?: PlanStatus;
      currentStep?: string;
      completeStepIndex?: number;
      addCommitsToStep?: { stepIndex: number; commits: string[] };
      satisfyCriterionIndex?: number;
      abandonReason?: string;
    }
  ): Promise<Plan> {
    const plan = await this.getPlan(id);
    if (!plan) {
      throw new Error(`Plan with id '${id}' not found.`);
    }

    const previousStatus = plan.status;

    if (updates.completeStepIndex !== undefined && plan.steps[updates.completeStepIndex]) {
      plan.steps[updates.completeStepIndex].status = 'completed';
      const nextPending = plan.steps.find((s) => s.status === 'pending');
      if (nextPending) {
        nextPending.status = 'in_progress';
        plan.currentStep = nextPending.description;
        const nextNext = plan.steps.filter((s) => s.status === 'pending')[1];
        plan.nextStep = nextNext ? nextNext.description : 'Final verification';
      } else {
        plan.currentStep = 'All steps completed';
        plan.nextStep = 'Plan verification and handover';
      }
    }

    if (updates.addCommitsToStep && plan.steps[updates.addCommitsToStep.stepIndex]) {
      const step = plan.steps[updates.addCommitsToStep.stepIndex];
      step.commits = Array.from(new Set([...step.commits, ...updates.addCommitsToStep.commits]));
    }

    if (updates.satisfyCriterionIndex !== undefined && plan.acceptanceCriteria[updates.satisfyCriterionIndex]) {
      plan.acceptanceCriteria[updates.satisfyCriterionIndex].satisfied = true;
    }

    if (updates.currentStep) {
      plan.currentStep = updates.currentStep;
    }

    if (updates.status) {
      plan.status = updates.status;
    }

    if (updates.abandonReason) {
      plan.abandonReason = updates.abandonReason;
    }

    plan.updatedAt = new Date().toISOString();

    // If status changed, move file to new directory
    if (updates.status && updates.status !== previousStatus) {
      const oldPath = path.join(this.getPlanDir(previousStatus), `${plan.id}.md`);
      const newPath = path.join(this.getPlanDir(updates.status), `${plan.id}.md`);
      await this.fs.ensureDir(this.getPlanDir(updates.status));
      if (this.fs.exists(oldPath)) {
        await this.fs.deleteFile(oldPath);
      }
      await this.fs.writeFile(newPath, this.formatPlanMarkdown(plan));
    } else {
      await this.savePlanFile(plan);
    }

    return plan;
  }

  async completePlan(id: string): Promise<Plan> {
    const plan = await this.getPlan(id);
    if (!plan) throw new Error(`Plan '${id}' not found.`);

    plan.status = 'completed';
    plan.completedAt = new Date().toISOString();
    plan.updatedAt = plan.completedAt;
    for (const step of plan.steps) {
      step.status = 'completed';
    }
    for (const crit of plan.acceptanceCriteria) {
      crit.satisfied = true;
    }

    const oldPath = path.join(this.getPlanDir('active'), `${plan.id}.md`);
    const newPath = path.join(this.getPlanDir('completed'), `${plan.id}.md`);
    await this.fs.ensureDir(this.getPlanDir('completed'));
    if (this.fs.exists(oldPath)) {
      await this.fs.deleteFile(oldPath);
    }
    await this.fs.writeFile(newPath, this.formatPlanMarkdown(plan));
    return plan;
  }

  async blockPlan(id: string, reason: string): Promise<Plan> {
    return this.updatePlan(id, { status: 'blocked', abandonReason: reason });
  }

  async abandonPlan(id: string, reason: string): Promise<Plan> {
    return this.updatePlan(id, { status: 'abandoned', abandonReason: reason });
  }

  async listPlans(): Promise<{
    active: Plan[];
    blocked: Plan[];
    completed: Plan[];
    abandoned: Plan[];
  }> {
    const result = {
      active: [] as Plan[],
      blocked: [] as Plan[],
      completed: [] as Plan[],
      abandoned: [] as Plan[]
    };

    const statuses: Array<'active' | 'blocked' | 'completed' | 'abandoned'> = [
      'active',
      'blocked',
      'completed',
      'abandoned'
    ];

    for (const status of statuses) {
      const dir = this.getPlanDir(status);
      const files = await this.fs.listFiles(dir, '.md');
      for (const file of files) {
        const id = path.basename(file, '.md');
        const raw = await this.fs.readFile(file);
        const plan = this.parsePlanMarkdown(raw, id, status);
        if (plan) result[status].push(plan);
      }
    }

    return result;
  }

  private savePlanFile(plan: Plan): Promise<void> {
    const dir = this.getPlanDir(plan.status);
    const filePath = path.join(dir, `${plan.id}.md`);
    const content = this.formatPlanMarkdown(plan);
    return this.fs.writeFile(filePath, content);
  }

  private formatPlanMarkdown(p: Plan): string {
    const frontmatter = {
      id: p.id,
      title: p.title,
      status: p.status,
      goal: p.goal,
      currentStep: p.currentStep,
      nextStep: p.nextStep,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      completedAt: p.completedAt,
      abandonReason: p.abandonReason
    };

    const stepsText = p.steps
      .map((s) => {
        const check = s.status === 'completed' ? '[x]' : s.status === 'in_progress' ? '[/]' : '[ ]';
        let line = `- ${check} ${s.description}`;
        if (s.commits && s.commits.length > 0) {
          line += `\n  - Commits: ${s.commits.join(', ')}`;
        }
        if (s.files && s.files.length > 0) {
          line += `\n  - Files: ${s.files.join(', ')}`;
        }
        return line;
      })
      .join('\n');

    const criteriaText = p.acceptanceCriteria
      .map((c) => `- [${c.satisfied ? 'x' : ' '}] ${c.description}`)
      .join('\n');

    const body = `# Plan: ${p.title}

Status: ${p.status.toUpperCase()}

## Goal
${p.goal}

## Scope
${MarkdownHelper.formatBulletList(p.scope)}

## Plan Steps
${stepsText || 'No steps specified.'}

## Constraints
${MarkdownHelper.formatBulletList(p.constraints)}

## Acceptance Criteria
${criteriaText || 'No criteria defined.'}

## Current Step
${p.currentStep || 'None'}

## Next Step
${p.nextStep || 'None'}

${p.abandonReason ? `## Reason\n${p.abandonReason}\n` : ''}
`;

    return MarkdownHelper.stringify(body, frontmatter);
  }

  private parsePlanMarkdown(raw: string, fallbackId: string, fallbackStatus: PlanStatus): Plan {
    const parsed = MarkdownHelper.parse<any>(raw);
    const sections = MarkdownHelper.extractSections(parsed.content);

    const title = parsed.data.title || fallbackId;
    const goal = parsed.data.goal || sections.get('Goal') || '';
    const status = (parsed.data.status as PlanStatus) || fallbackStatus;

    // Parse steps
    const stepsRaw = sections.get('Plan Steps') || '';
    const steps: PlanStep[] = [];
    const stepLines = stepsRaw.split('\n');
    let currentStepItem: PlanStep | null = null;

    for (const line of stepLines) {
      const match = line.match(/^-\s*\[([ x/])\]\s*(.+)$/);
      if (match) {
        if (currentStepItem) steps.push(currentStepItem);
        const check = match[1];
        const stepStatus = check === 'x' ? 'completed' : check === '/' ? 'in_progress' : 'pending';
        currentStepItem = {
          id: `step-${steps.length + 1}`,
          description: match[2].trim(),
          status: stepStatus,
          commits: [],
          files: []
        };
      } else if (currentStepItem && line.trim().startsWith('- Commits:')) {
        currentStepItem.commits = line.replace(/.*- Commits:\s*/, '').split(',').map((c) => c.trim());
      } else if (currentStepItem && line.trim().startsWith('- Files:')) {
        currentStepItem.files = line.replace(/.*- Files:\s*/, '').split(',').map((f) => f.trim());
      }
    }
    if (currentStepItem) steps.push(currentStepItem);

    // Parse acceptance criteria
    const criteriaRaw = sections.get('Acceptance Criteria') || '';
    const criteria: AcceptanceCriterion[] = [];
    for (const line of criteriaRaw.split('\n')) {
      const match = line.match(/^-\s*\[([ x])\]\s*(.+)$/);
      if (match) {
        criteria.push({
          id: `crit-${criteria.length + 1}`,
          description: match[2].trim(),
          satisfied: match[1] === 'x'
        });
      }
    }

    return {
      id: parsed.data.id || fallbackId,
      title,
      status,
      goal,
      scope: MarkdownHelper.parseBulletList(sections.get('Scope') || ''),
      steps,
      constraints: MarkdownHelper.parseBulletList(sections.get('Constraints') || ''),
      dependencies: MarkdownHelper.parseBulletList(sections.get('Dependencies') || ''),
      acceptanceCriteria: criteria,
      currentStep: parsed.data.currentStep || sections.get('Current Step'),
      nextStep: parsed.data.nextStep || sections.get('Next Step'),
      createdAt: parsed.data.createdAt || new Date().toISOString(),
      updatedAt: parsed.data.updatedAt || new Date().toISOString(),
      completedAt: parsed.data.completedAt,
      abandonReason: parsed.data.abandonReason || sections.get('Reason')
    };
  }
}
