import { z } from 'zod';

export const PlanStatusSchema = z.enum(['planned', 'active', 'blocked', 'completed', 'abandoned']);
export type PlanStatus = z.infer<typeof PlanStatusSchema>;

export const PlanStepSchema = z.object({
  id: z.string(),
  description: z.string(),
  status: z.enum(['pending', 'in_progress', 'completed', 'blocked']).default('pending'),
  commits: z.array(z.string()).default([]),
  files: z.array(z.string()).default([])
});

export type PlanStep = z.infer<typeof PlanStepSchema>;

export const AcceptanceCriterionSchema = z.object({
  id: z.string(),
  description: z.string(),
  satisfied: z.boolean().default(false)
});

export type AcceptanceCriterion = z.infer<typeof AcceptanceCriterionSchema>;

export const PlanSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: PlanStatusSchema.default('active'),
  goal: z.string(),
  scope: z.array(z.string()).default([]),
  steps: z.array(PlanStepSchema).default([]),
  constraints: z.array(z.string()).default([]),
  dependencies: z.array(z.string()).default([]),
  acceptanceCriteria: z.array(AcceptanceCriterionSchema).default([]),
  currentStep: z.string().optional(),
  nextStep: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  completedAt: z.string().optional(),
  abandonReason: z.string().optional()
});

export type Plan = z.infer<typeof PlanSchema>;
