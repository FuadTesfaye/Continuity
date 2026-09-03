import { FileSystem } from '../../core/storage/file-system.js';
import { PlanManager } from '../../core/engine/plan-manager.js';
import { GitClient } from '../../core/git/git-client.js';
import { VerificationEngine } from '../../core/verify/verification-engine.js';
import { TerminalFormatter } from '../formatters/terminal.js';

export interface VerifyOptions {
  test?: boolean;
}

export async function runVerify(planId?: string, options: VerifyOptions = {}): Promise<void> {
  const fs = new FileSystem();
  if (!fs.isInitialized()) {
    TerminalFormatter.error("Continuity is not initialized. Run 'continuity init' first.");
    process.exitCode = 1;
    return;
  }

  const git = new GitClient();
  const planManager = new PlanManager(fs);
  const verifier = new VerificationEngine(planManager, git, fs);

  TerminalFormatter.header('Continuity Plan & Work Verification');

  const report = await verifier.verify(planId, options.test ?? false);

  for (const check of report.checks) {
    if (check.passed) {
      TerminalFormatter.success(`${check.name}: ${check.message}`);
    } else if (check.warning) {
      TerminalFormatter.warning(`${check.name}: ${check.message}`);
    } else {
      TerminalFormatter.error(`${check.name}: ${check.message}`);
    }
  }

  if (report.testOutput && options.test) {
    TerminalFormatter.section('TEST OUTPUT');
    console.log(report.testOutput);
  }

  TerminalFormatter.section('VERIFICATION STATUS');
  const statusColor =
    report.status === 'READY_FOR_HANDOVER'
      ? 'READY FOR HANDOVER'
      : report.status === 'BLOCKED'
        ? 'BLOCKED'
        : 'IN PROGRESS';

  TerminalFormatter.item('Status', statusColor);
  TerminalFormatter.item('Next Recommended Action', report.nextRecommendedAction);

  if (report.status === 'READY_FOR_HANDOVER') {
    TerminalFormatter.box('Ready for Handover', [
      'All planned steps and criteria are satisfied.',
      'Run: continuity handover'
    ]);
  }
}
