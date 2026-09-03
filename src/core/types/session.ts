import { z } from 'zod';

export const SessionSummarySchema = z.object({
  id: z.string(),
  date: z.string(),
  agent: z.string().default('ai'),
  branch: z.string().default('main'),
  task: z.string().optional(),
  objective: z.string(),
  workCompleted: z.array(z.string()).default([]),
  filesChanged: z.array(z.string()).default([]),
  decisions: z.array(z.string()).default([]),
  failedApproaches: z.array(z.string()).default([]),
  problems: z.array(z.string()).default([]),
  nextStep: z.string().optional(),
  importantContext: z.string().optional(),
  gitCommit: z.string().optional()
});

export type SessionSummary = z.infer<typeof SessionSummarySchema>;

export interface RawSession {
  id: string;
  date: string;
  agent: string;
  content: string;
}
