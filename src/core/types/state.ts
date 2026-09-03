import { z } from 'zod';
import { NextActionSchema } from './handover.js';

export const ProjectInfoSchema = z.object({
  name: z.string(),
  purpose: z.string().default(''),
  stack: z.array(z.string()).default([]),
  architecture: z.string().default(''),
  database: z.string().optional(),
  infrastructure: z.array(z.string()).default([]),
  repository: z.string().optional()
});

export type ProjectInfo = z.infer<typeof ProjectInfoSchema>;

export const ContinuityStateSchema = z.object({
  project: z.string(),
  currentBranch: z.string().default('main'),
  currentTask: z.string().default('No active task'),
  status: z.string().default('Ready'),
  progress: z.number().min(0).max(100).default(0),
  completed: z.array(z.string()).default([]),
  remaining: z.array(z.string()).default([]),
  currentFiles: z.array(z.string()).default([]),
  currentBlocker: z.string().nullable().default(null),
  lastAction: z.string().default('Project initialized'),
  nextAction: NextActionSchema.or(z.string()).default({
    problem: 'No blocker',
    expectedSolution: 'Continue with next task',
    constraints: []
  }),
  lastSession: z.string().optional(),
  lastCommit: z.string().optional(),
  updatedAt: z.string()
});

export type ContinuityState = z.infer<typeof ContinuityStateSchema>;
