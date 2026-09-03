import { z } from 'zod';

export const NextActionSchema = z.object({
  file: z.string().optional(),
  focus: z.string().optional(),
  problem: z.string(),
  expectedSolution: z.string(),
  constraints: z.array(z.string()).default([])
});

export type NextAction = z.infer<typeof NextActionSchema>;

export const HandoverSchema = z.object({
  id: z.string(),
  date: z.string(),
  project: z.string(),
  branch: z.string(),
  commit: z.string().optional(),
  currentTask: z.string().optional(),
  progress: z.number().min(0).max(100).default(0),
  completed: z.array(z.string()).default([]),
  remaining: z.array(z.string()).default([]),
  modifiedFiles: z.array(z.string()).default([]),
  uncommittedChanges: z.boolean().default(false),
  planId: z.string().optional(),
  planStep: z.string().optional(),
  commits: z.array(z.string()).default([]),
  decisions: z.array(z.string()).default([]),
  problems: z.array(z.string()).default([]),
  failedApproaches: z.array(z.string()).default([]),
  nextAction: NextActionSchema,
  author: z.string().default('ai')
});

export type Handover = z.infer<typeof HandoverSchema>;
