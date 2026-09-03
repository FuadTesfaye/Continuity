import { ContextItem, ContextTier, RankedContextPayload } from '../types/context.js';
import { Plan } from '../types/plan.js';
import { TaskItem } from '../types/task.js';
import { Decision } from '../types/decision.js';
import { Failure } from '../types/failure.js';
import { SessionSummary } from '../types/session.js';
import { GitCommitInfo } from '../git/git-client.js';

export interface ContextCandidates {
  task?: TaskItem;
  plan?: Plan;
  currentFiles: string[];
  recentCommits: GitCommitInfo[];
  sessions: SessionSummary[];
  decisions: Decision[];
  failures: Failure[];
  uncommittedDiff?: string;
  branch: string;
  headCommit?: string;
}

export class ContextRanker {
  rank(candidates: ContextCandidates): RankedContextPayload {
    const items: ContextItem[] = [];
    const taskTitle = candidates.task?.title || 'Active Work';
    const taskWords = new Set(taskTitle.toLowerCase().split(/\s+/).filter((w) => w.length > 2));
    const targetFiles = new Set(candidates.currentFiles.map((f) => f.toLowerCase()));

    // 1. Plan Context
    if (candidates.plan) {
      const p = candidates.plan;
      let planScore = 0.85; // Active plan is high priority
      const reasons = ['Active architectural plan'];

      const stepText = p.steps.map((s) => `[${s.status}] ${s.description}`).join('; ');
      items.push({
        id: `plan-${p.id}`,
        source: 'plan',
        title: `Plan: ${p.title} (${p.status.toUpperCase()})`,
        summary: `Goal: ${p.goal} | Current Step: ${p.currentStep || 'None'}`,
        content: `Goal: ${p.goal}\nSteps: ${stepText}\nConstraints: ${p.constraints.join(', ')}`,
        files: p.steps.flatMap((s) => s.files),
        commits: p.steps.flatMap((s) => s.commits),
        score: planScore,
        tier: 'HIGH',
        reasons
      });
    }

    // 2. Git Commits
    for (const commit of candidates.recentCommits) {
      let score = 0.15; // base
      const reasons: string[] = [];

      // Check if commit touches target files
      if (commit.filesChanged) {
        const touchesTarget = commit.filesChanged.some((f) => targetFiles.has(f.toLowerCase()));
        if (touchesTarget) {
          score += 0.40;
          reasons.push('Touches currently active files');
        }
      }

      // Check commit message keyword overlap
      const msgWords = commit.message.toLowerCase().split(/\s+/);
      const overlap = msgWords.filter((w) => taskWords.has(w)).length;
      if (overlap > 0) {
        score += Math.min(0.35, overlap * 0.15);
        reasons.push(`Commit message matches task (${overlap} keywords)`);
      }

      // Recency
      score += 0.10;

      const tier: ContextTier = score >= 0.5 ? 'HIGH' : score >= 0.25 ? 'MEDIUM' : 'FILTERED';
      items.push({
        id: `commit-${commit.shortHash}`,
        source: 'git',
        title: `Commit ${commit.shortHash}: ${commit.message}`,
        summary: `${commit.author} on ${commit.date}`,
        content: commit.message,
        files: commit.filesChanged || [],
        commits: [commit.shortHash],
        date: commit.date,
        score,
        tier,
        reasons
      });
    }

    // 3. Decisions (ADRs)
    for (const decision of candidates.decisions) {
      let score = 0.20;
      const reasons: string[] = [];

      const decisionWords = (decision.title + ' ' + decision.decision + ' ' + decision.why).toLowerCase().split(/\s+/);
      const overlap = decisionWords.filter((w) => taskWords.has(w)).length;
      if (overlap > 0) {
        score += Math.min(0.50, overlap * 0.20);
        reasons.push(`ADR aligns with task keywords (${overlap})`);
      }

      const touchesFile = Array.from(targetFiles).some(
        (f) => decision.decision.toLowerCase().includes(f) || decision.why.toLowerCase().includes(f)
      );
      if (touchesFile) {
        score += 0.35;
        reasons.push('Decision references active file');
      }

      const tier: ContextTier = score >= 0.5 ? 'HIGH' : score >= 0.25 ? 'MEDIUM' : 'FILTERED';
      items.push({
        id: `adr-${decision.id}`,
        source: 'decision',
        title: `${decision.id}: ${decision.title}`,
        summary: decision.decision,
        content: `Decision: ${decision.decision}\nWhy: ${decision.why}`,
        files: [],
        commits: [],
        date: decision.date,
        score,
        tier,
        reasons
      });
    }

    // 4. Failures & "Do Not Repeat"
    for (const failure of candidates.failures) {
      let score = 0.30; // Failures are inherently medium-to-high to prevent repetition
      const reasons = ['Failed approach lesson'];

      const failureWords = (failure.title + ' ' + failure.attempt + ' ' + failure.why).toLowerCase().split(/\s+/);
      const overlap = failureWords.filter((w) => taskWords.has(w)).length;
      if (overlap > 0) {
        score += 0.35;
        reasons.push('Directly related to active task context');
      }

      const touchesFile = failure.relatedFiles.some((rf) => targetFiles.has(rf.toLowerCase()));
      if (touchesFile) {
        score += 0.30;
        reasons.push('Touches current files');
      }

      const tier: ContextTier = score >= 0.5 ? 'HIGH' : score >= 0.25 ? 'MEDIUM' : 'FILTERED';
      items.push({
        id: `failure-${failure.id}`,
        source: 'failure',
        title: `DO NOT REPEAT: ${failure.title}`,
        summary: `${failure.doNotRepeat} -> ${failure.betterApproach}`,
        content: `Attempt: ${failure.attempt}\nWhy: ${failure.why}\nDo Not Repeat: ${failure.doNotRepeat}\nBetter Approach: ${failure.betterApproach}`,
        files: failure.relatedFiles,
        commits: [],
        date: failure.date,
        score,
        tier,
        reasons
      });
    }

    // 5. Previous Sessions
    for (const session of candidates.sessions) {
      let score = 0.10;
      const reasons: string[] = [];

      const sessionWords = (session.objective + ' ' + session.workCompleted.join(' ')).toLowerCase().split(/\s+/);
      const overlap = sessionWords.filter((w) => taskWords.has(w)).length;
      if (overlap > 0) {
        score += Math.min(0.40, overlap * 0.15);
        reasons.push('Session completed work related to task');
      }

      const touchesFile = session.filesChanged.some((fc) => targetFiles.has(fc.toLowerCase()));
      if (touchesFile) {
        score += 0.35;
        reasons.push('Session modified current files');
      }

      const tier: ContextTier = score >= 0.5 ? 'HIGH' : score >= 0.25 ? 'MEDIUM' : 'FILTERED';
      items.push({
        id: `sess-${session.id}`,
        source: 'session',
        title: `Session: ${session.objective}`,
        summary: `Agent: ${session.agent} (${session.date})`,
        content: `Work: ${session.workCompleted.join('; ')}\nNext: ${session.nextStep || 'None'}`,
        files: session.filesChanged,
        commits: session.gitCommit ? [session.gitCommit] : [],
        date: session.date,
        score,
        tier,
        reasons
      });
    }

    // Sort items by score descending
    items.sort((a, b) => b.score - a.score);

    const highPriority = items.filter((i) => i.tier === 'HIGH');
    const mediumPriority = items.filter((i) => i.tier === 'MEDIUM');

    // Rough token estimate (chars / 4)
    const allContent = [...highPriority, ...mediumPriority].map((i) => i.content).join(' ');
    const tokenEstimate = Math.ceil(allContent.length / 4);

    return {
      task: taskTitle,
      branch: candidates.branch,
      commit: candidates.headCommit,
      highPriority,
      mediumPriority,
      totalScore: items.reduce((acc, i) => acc + i.score, 0),
      tokenEstimate
    };
  }

  formatPrompt(ranked: RankedContextPayload, uncommittedDiff?: string): string {
    const lines: string[] = [
      '# CONTINUITY CONTEXT PACKAGE',
      `Task: ${ranked.task}`,
      `Branch: ${ranked.branch}${ranked.commit ? ` (${ranked.commit})` : ''}`,
      '\n## HIGH PRIORITY CONTEXT'
    ];

    for (const item of ranked.highPriority) {
      lines.push(`\n### [${item.source.toUpperCase()}] ${item.title}`);
      lines.push(item.content);
      if (item.files.length > 0) lines.push(`Relevant Files: ${item.files.join(', ')}`);
    }

    if (ranked.mediumPriority.length > 0) {
      lines.push('\n## MEDIUM PRIORITY CONTEXT (HISTORICAL)');
      for (const item of ranked.mediumPriority.slice(0, 5)) {
        lines.push(`\n- **[${item.source.toUpperCase()}] ${item.title}**: ${item.summary}`);
      }
    }

    if (uncommittedDiff) {
      lines.push('\n## CURRENT UNCOMMITTED CHANGES');
      lines.push(uncommittedDiff);
    }

    return lines.join('\n');
  }
}
