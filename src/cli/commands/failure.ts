import { FileSystem } from '../../core/storage/file-system.js';
import { FailureManager } from '../../core/engine/failure-manager.js';
import { TerminalFormatter } from '../formatters/terminal.js';

export interface FailureOptions {
  attempt?: string;
  result?: string;
  why?: string;
  doNotRepeat?: string;
  better?: string;
  files?: string;
  list?: boolean;
}

export async function runFailure(title?: string, options: FailureOptions = {}): Promise<void> {
  const fs = new FileSystem();
  if (!fs.isInitialized()) {
    TerminalFormatter.error("Continuity is not initialized. Run 'continuity init' first.");
    process.exitCode = 1;
    return;
  }

  const failureManager = new FailureManager(fs);

  if (options.list || !title) {
    const failures = await failureManager.listFailures();
    TerminalFormatter.header(`Recorded Failures & "Do Not Repeat" Lessons (${failures.length})`);
    if (failures.length === 0) {
      console.log('No failures recorded yet.');
      return;
    }
    for (const f of failures) {
      console.log(`\n• ${f.title} (${f.date})`);
      console.log(`  Attempt: ${f.attempt}`);
      console.log(`  Result: ${f.result}`);
      console.log(`  ⚠️ DO NOT REPEAT: ${f.doNotRepeat}`);
      console.log(`  ✓ BETTER APPROACH: ${f.betterApproach}`);
    }
    return;
  }

  const relatedFiles = options.files ? options.files.split(',').map((s) => s.trim()) : [];
  const failure = await failureManager.recordFailure({
    title,
    attempt: options.attempt || title,
    result: options.result || 'Failed approach',
    why: options.why || 'Did not meet requirements or caused architectural regression',
    doNotRepeat: options.doNotRepeat || 'Do not repeat this attempt',
    betterApproach: options.better || 'Consider transaction wrappers or clean refactoring',
    relatedFiles
  });

  TerminalFormatter.warning(`Recorded Failed Approach: "${failure.title}"`);
  TerminalFormatter.item('Do Not Repeat', failure.doNotRepeat);
  TerminalFormatter.item('Better Approach', failure.betterApproach);
  TerminalFormatter.info(`Stored in .continuity/failures/${failure.id}.md`);
}
