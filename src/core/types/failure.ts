import { z } from 'zod';

export const FailureSchema = z.object({
  id: z.string(),
  title: z.string(),
  date: z.string(),
  attempt: z.string(),
  result: z.string(),
  why: z.string(),
  doNotRepeat: z.string(),
  betterApproach: z.string(),
  relatedTask: z.string().optional(),
  relatedFiles: z.array(z.string()).default([])
});

export type Failure = z.infer<typeof FailureSchema>;
