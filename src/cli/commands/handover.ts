import { FileSystem } from '../../core/storage/file-system.js';
import { GitClient } from '../../core/git/git-client.js';
import { StateManager } from '../../core/engine/state-manager.js';
import { DecisionManager } from '../../core/engine/decision-manager.js';
import { FailureManager } from '../../core/engine/failure-manager.js';
import { HandoverManager } from '../../core/engine/handover-manager.js';
import { TerminalFormatter } from '../formatters/terminal.js';

export interface HandoverOptions {
  task?: string;
  progress?: string;
  completed?: string;
  remaining?: string;
  problem?: string;
  solution?: string;
  file?: string;
  focus?: string;
  constraints?: string;
  author?: string;
}

export async function runHandover(options: HandoverOptions = {}): Promise<void> {
  const fs = new FileSystem();
  if (!fs.isInitialized()) {
    TerminalFormatter.error("Continuity is not initialized in this project. Run 'continuity init' first.");
    process.exitCode = 1;
    return;
  }

  const git = new GitClient();
  const stateManager = new StateManager(fs);
  const decisionManager = new DecisionManager(fs);
  const failureManager = new FailureManager(fs);
  const planManager = new PlanManager(fs);
  const handoverManager = new HandoverManager(fs, git, stateManager, decisionManager, failureManager);

  const currentState = await stateManager.getState();
  const activePlan = await planManager.getActivePlan();

  const progress = options.progress !== undefined ? parseInt(options.progress, 10) : activePlan ? Math.round((activePlan.steps.filter(s => s.status === 'completed').length / Math.max(1, activePlan.steps.length)) * 100) : undefined;
  const completed = options.completed ? options.completed.split(',').map((s) => s.trim()) : activePlan ? activePlan.steps.filter(s => s.status === 'completed').map(s => s.description) : undefined;
  const remaining = options.remaining ? options.remaining.split(',').map((s) => s.trim()) : activePlan ? activePlan.steps.filter(s => s.status !== 'completed').map(s => s.description) : undefined;
  const constraints = options.constraints ? options.constraints.split(',').map((s) => s.trim()) : activePlan ? activePlan.constraints : [];

  const nextAction = {
    file: options.file,
    focus: options.focus,
    problem: options.problem || (typeof currentState.nextAction === 'object' ? currentState.nextAction.problem : 'No blocker specified'),
    expectedSolution: options.solution || (typeof currentState.nextAction === 'object' ? currentState.nextAction.expectedSolution : 'Continue implementation'),
    constraints
  };

  const handover = await handoverManager.createHandover({
    currentTask: options.task || currentState.currentTask,
    progress,
    completed,
    remaining,
    nextAction,
    author: options.author || 'ai'
  });

  TerminalFormatter.header('Handover Created');
  TerminalFormatter.item('Handover ID', handover.id);
  TerminalFormatter.item('Task', handover.currentTask);
  TerminalFormatter.item('Progress', `${handover.progress}%`);
  TerminalFormatter.item('Branch', handover.branch);
  TerminalFormatter.item('Modified Files', handover.modifiedFiles.length);

  TerminalFormatter.box('Actionable Next Action', [
    handover.nextAction.file ? `File: ${handover.nextAction.file}` : 'File: None specified',
    handover.nextAction.focus ? `Focus: ${handover.nextAction.focus}` : '',
    `Problem: ${handover.nextAction.problem}`,
    `Solution: ${handover.nextAction.expectedSolution}`
  ].filter(Boolean));

  TerminalFormatter.success('Handover archived in .continuity/handovers/ and synced to .continuity/state.md');
}
