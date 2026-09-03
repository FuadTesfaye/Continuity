import { FileSystem } from '../../core/storage/file-system.js';
import { StateManager } from '../../core/engine/state-manager.js';
import { TaskManager } from '../../core/engine/task-manager.js';
import { TerminalFormatter } from '../formatters/terminal.js';

export async function runTaskStart(
  title: string,
  options: { description?: string; remaining?: string; files?: string } = {}
): Promise<void> {
  const fs = new FileSystem();
  if (!fs.isInitialized()) {
    TerminalFormatter.error("Continuity is not initialized. Run 'continuity init' first.");
    process.exitCode = 1;
    return;
  }

  const stateManager = new StateManager(fs);
  const taskManager = new TaskManager(fs, stateManager);

  const remaining = options.remaining ? options.remaining.split(',').map((s) => s.trim()) : [];
  const relatedFiles = options.files ? options.files.split(',').map((s) => s.trim()) : [];

  const task = await taskManager.startTask(title, {
    description: options.description,
    remaining,
    relatedFiles
  });

  TerminalFormatter.success(`Task started: "${task.title}" (id: ${task.id})`);
  TerminalFormatter.info(`Created .continuity/tasks/active/${task.id}.md`);
  TerminalFormatter.info('Synced with .continuity/state.md');
}

export async function runTaskUpdate(
  id?: string,
  options: {
    progress?: string;
    completed?: string;
    remaining?: string;
    blocker?: string;
    files?: string;
  } = {}
): Promise<void> {
  const fs = new FileSystem();
  if (!fs.isInitialized()) {
    TerminalFormatter.error("Continuity is not initialized. Run 'continuity init' first.");
    process.exitCode = 1;
    return;
  }

  const stateManager = new StateManager(fs);
  const taskManager = new TaskManager(fs, stateManager);

  // If id is not specified, check state.md for current active task
  let taskId = id;
  if (!taskId) {
    const state = await stateManager.getState();
    const tasks = await taskManager.listTasks();
    const activeMatch = tasks.active.find((t) => t.title === state.currentTask);
    if (activeMatch) {
      taskId = activeMatch.id;
    } else if (tasks.active.length > 0) {
      taskId = tasks.active[0].id;
    } else {
      TerminalFormatter.error('No active task found to update. Specify a task id or run "continuity task start".');
      process.exitCode = 1;
      return;
    }
  }

  const progress = options.progress !== undefined ? parseInt(options.progress, 10) : undefined;
  const addCompleted = options.completed ? options.completed.split(',').map((s) => s.trim()) : undefined;
  const addRemaining = options.remaining ? options.remaining.split(',').map((s) => s.trim()) : undefined;
  const relatedFiles = options.files ? options.files.split(',').map((s) => s.trim()) : undefined;

  const updated = await taskManager.updateTask(taskId, {
    progress,
    addCompleted,
    addRemaining,
    blocker: options.blocker,
    relatedFiles
  });

  TerminalFormatter.success(`Task updated: "${updated.title}"`);
  TerminalFormatter.item('Progress', `${updated.progress}%`);
  TerminalFormatter.item('Completed Items', updated.completed.length);
  TerminalFormatter.item('Remaining Items', updated.remaining.length);
}

export async function runTaskComplete(id?: string, options: { summary?: string } = {}): Promise<void> {
  const fs = new FileSystem();
  if (!fs.isInitialized()) {
    TerminalFormatter.error("Continuity is not initialized. Run 'continuity init' first.");
    process.exitCode = 1;
    return;
  }

  const stateManager = new StateManager(fs);
  const taskManager = new TaskManager(fs, stateManager);

  let taskId = id;
  if (!taskId) {
    const tasks = await taskManager.listTasks();
    if (tasks.active.length > 0) {
      taskId = tasks.active[0].id;
    } else {
      TerminalFormatter.error('No active task found to complete.');
      process.exitCode = 1;
      return;
    }
  }

  const completed = await taskManager.completeTask(taskId, options.summary);
  TerminalFormatter.success(`Task marked completed: "${completed.title}"`);
  TerminalFormatter.info(`Moved to .continuity/tasks/completed/${completed.id}.md`);
  TerminalFormatter.info('Run "continuity handover" to prepare continuation package for the next milestone.');
}

export async function runTaskBlock(id: string, options: { reason: string }): Promise<void> {
  const fs = new FileSystem();
  if (!fs.isInitialized()) {
    TerminalFormatter.error("Continuity is not initialized. Run 'continuity init' first.");
    process.exitCode = 1;
    return;
  }

  const stateManager = new StateManager(fs);
  const taskManager = new TaskManager(fs, stateManager);

  const blocked = await taskManager.blockTask(id, options.reason || 'Blocked by external dependency');
  TerminalFormatter.warning(`Task blocked: "${blocked.title}"`);
  TerminalFormatter.info(`Reason: ${options.reason}`);
  TerminalFormatter.info(`Moved to .continuity/tasks/blocked/${blocked.id}.md`);
}

export async function runTaskList(): Promise<void> {
  const fs = new FileSystem();
  if (!fs.isInitialized()) {
    TerminalFormatter.error("Continuity is not initialized. Run 'continuity init' first.");
    process.exitCode = 1;
    return;
  }

  const stateManager = new StateManager(fs);
  const taskManager = new TaskManager(fs, stateManager);
  const tasks = await taskManager.listTasks();

  TerminalFormatter.header('Continuity Tasks');

  console.log(`\nACTIVE (${tasks.active.length}):`);
  if (tasks.active.length === 0) console.log('  None');
  for (const t of tasks.active) {
    console.log(`  • [${t.progress}%] ${t.title} (id: ${t.id})`);
  }

  console.log(`\nBLOCKED (${tasks.blocked.length}):`);
  if (tasks.blocked.length === 0) console.log('  None');
  for (const t of tasks.blocked) {
    console.log(`  • ${t.title} - Blocker: ${t.blockers.join(', ')}`);
  }

  console.log(`\nCOMPLETED (${tasks.completed.length}):`);
  if (tasks.completed.length === 0) console.log('  None');
  for (const t of tasks.completed) {
    console.log(`  ✓ ${t.title} (completed: ${t.completedAt?.split('T')[0]})`);
  }
}
