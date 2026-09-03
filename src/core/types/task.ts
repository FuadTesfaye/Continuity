import { z } from 'zod';

export const TaskStatusSchema = z.enum(['active', 'completed', 'blocked']);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

export const TaskItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: TaskStatusSchema.default('active'),
  progress: z.number().min(0).max(100).default(0),
  description: z.string().optional(),
  completed: z.array(z.string()).default([]),
  remaining: z.array(z.string()).default([]),
  blockers: z.array(z.string()).default([]),
  relatedFiles: z.array(z.string()).default([]),
  planId: z.string().optional(),
  commits: z.array(z.string()).default([]),
  acceptanceCriteria: z.array(z.string()).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
  completedAt: z.string().optional()
});

export type TaskItem = z.infer<typeof TaskItemSchema>;
