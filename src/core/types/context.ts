export type ContextTier = 'HIGH' | 'MEDIUM' | 'FILTERED';

export type ContextSourceType =
  | 'code'
  | 'git'
  | 'state'
  | 'plan'
  | 'session'
  | 'decision'
  | 'failure';

export interface ContextItem {
  id: string;
  source: ContextSourceType;
  title: string;
  summary: string;
  content: string;
  files: string[];
  commits: string[];
  date?: string;
  score: number;
  tier: ContextTier;
  reasons: string[];
}

export interface RankedContextPayload {
  task: string;
  branch: string;
  commit?: string;
  highPriority: ContextItem[];
  mediumPriority: ContextItem[];
  totalScore: number;
  tokenEstimate: number;
}
