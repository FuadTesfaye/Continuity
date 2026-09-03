import { describe, it, expect } from 'vitest';
import { ContextRanker } from '../../src/core/context/context-ranker.js';

describe('ContextRanker', () => {
  const ranker = new ContextRanker();

  it('correctly scores, tiers, and formats relevant context across 6 sources', () => {
    const payload = ranker.rank({
      task: {
        id: 'task-payment-retry',
        title: 'Fix payment retry logic',
        status: 'active',
        progress: 50,
        description: 'Address transaction deadlocks',
        completed: [],
        remaining: [],
        blockers: [],
        relatedFiles: ['src/payment/service.ts'],
        commits: [],
        acceptanceCriteria: [],
        createdAt: '2026-09-03',
        updatedAt: '2026-09-03'
      },
      plan: {
        id: 'payment-refactor',
        title: 'Payment Refactor',
        status: 'active',
        goal: 'Refactor payment layer',
        scope: [],
        steps: [
          { id: '1', description: 'Extract service', status: 'completed', commits: [], files: ['src/payment/service.ts'] },
          { id: '2', description: 'Add retry handling', status: 'in_progress', commits: [], files: ['src/payment/retry.ts'] }
        ],
        constraints: ['Keep API intact'],
        dependencies: [],
        acceptanceCriteria: [],
        currentStep: 'Add retry handling',
        createdAt: '2026-09-03',
        updatedAt: '2026-09-03'
      },
      currentFiles: ['src/payment/service.ts'],
      recentCommits: [
        {
          hash: 'a81d92e111',
          shortHash: 'a81d92e',
          message: 'refactor: fix payment retry edge case',
          author: 'dev',
          date: '2026-09-03',
          filesChanged: ['src/payment/service.ts']
        },
        {
          hash: '9999999999',
          shortHash: '9999999',
          message: 'docs: update unrelated readme',
          author: 'dev',
          date: '2026-09-01',
          filesChanged: ['README.md']
        }
      ],
      sessions: [
        {
          id: 'sess_1',
          date: '2026-09-02',
          agent: 'claude',
          branch: 'main',
          objective: 'Debug payment deadlocks',
          workCompleted: ['Isolated payment deadlock in retry loop'],
          filesChanged: ['src/payment/service.ts'],
          decisions: [],
          failedApproaches: [],
          problems: [],
          commitsCreated: [],
          stagedChanges: [],
          unstagedChanges: []
        }
      ],
      decisions: [
        {
          id: 'ADR-017',
          title: 'Payment Transaction Atomicity',
          date: '2026-09-02',
          status: 'accepted',
          decision: 'Payment transactions in src/payment/service.ts must remain atomic',
          why: 'Prevent double charging during retry',
          alternatives: [],
          author: 'lead'
        }
      ],
      failures: [
        {
          id: 'fail_01',
          title: 'Manual payment rollback',
          date: '2026-09-02',
          attempt: 'Manual transaction rollback',
          result: 'Inconsistent state',
          why: 'Deadlock between threads',
          doNotRepeat: 'Do not invoke manual rollback',
          betterApproach: 'Use unit of work context manager',
          relatedFiles: ['src/payment/service.ts']
        }
      ],
      branch: 'feature/payment-refactor',
      headCommit: 'a81d92e'
    });

    expect(payload.highPriority.length).toBeGreaterThanOrEqual(3);
    const planItem = payload.highPriority.find((i) => i.source === 'plan');
    expect(planItem).toBeDefined();
    expect(planItem?.title).toContain('Payment Refactor');

    const promptText = ranker.formatPrompt(payload);
    expect(promptText).toContain('# CONTINUITY CONTEXT PACKAGE');
    expect(promptText).toContain('Payment Refactor');
    expect(promptText).toContain('HIGH PRIORITY CONTEXT');
  });
});
