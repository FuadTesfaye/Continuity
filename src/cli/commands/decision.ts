import { FileSystem } from '../../core/storage/file-system.js';
import { DecisionManager } from '../../core/engine/decision-manager.js';
import { TerminalFormatter } from '../formatters/terminal.js';

export interface DecisionOptions {
  why?: string;
  decision?: string;
  alternatives?: string;
  rejected?: string;
  list?: boolean;
}

export async function runDecision(title?: string, options: DecisionOptions = {}): Promise<void> {
  const fs = new FileSystem();
  if (!fs.isInitialized()) {
    TerminalFormatter.error("Continuity is not initialized. Run 'continuity init' first.");
    process.exitCode = 1;
    return;
  }

  const decisionManager = new DecisionManager(fs);

  if (options.list || !title) {
    const decisions = await decisionManager.listDecisions();
    TerminalFormatter.header(`Architecture Decision Records (${decisions.length})`);
    if (decisions.length === 0) {
      console.log('No decisions recorded yet. Run "continuity decision <title>" to record an ADR.');
      return;
    }
    for (const d of decisions) {
      console.log(`\n• [${d.id}] ${d.title} (${d.date})`);
      console.log(`  Decision: ${d.decision}`);
      console.log(`  Why: ${d.why}`);
    }
    return;
  }

  const alternatives = options.alternatives ? options.alternatives.split(',').map((s) => s.trim()) : [];
  const why = options.why || 'Architecture consistency and requirement alignment';
  const decisionText = options.decision || title;

  const adr = await decisionManager.recordDecision({
    title,
    decision: decisionText,
    why,
    alternatives,
    rejectedBecause: options.rejected
  });

  TerminalFormatter.success(`Recorded Architecture Decision: [${adr.id}] ${adr.title}`);
  TerminalFormatter.item('File', `.continuity/decisions/${adr.id}-*.md`);
  TerminalFormatter.item('Decision', adr.decision);
  TerminalFormatter.item('Why', adr.why);
}

export async function runLog(message: string): Promise<void> {
  // Shortcut for logging a quick decision or knowledge entry
  await runDecision(message, { why: 'Recorded via continuity log' });
}
