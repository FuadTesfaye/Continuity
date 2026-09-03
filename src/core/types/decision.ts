import { z } from 'zod';

export const DecisionSchema = z.object({
  id: z.string(), // e.g. "ADR-001" or "2026-09-03-rabbitmq"
  title: z.string(),
  status: z.enum(['proposed', 'accepted', 'superseded', 'deprecated']).default('accepted'),
  date: z.string(),
  decision: z.string(),
  why: z.string(),
  alternatives: z.array(z.string()).default([]),
  rejectedBecause: z.string().optional(),
  implications: z.array(z.string()).default([]),
  author: z.string().optional()
});

export type Decision = z.infer<typeof DecisionSchema>;
