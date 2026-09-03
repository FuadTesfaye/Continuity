import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { FileSystem } from '../../src/core/storage/file-system.js';
import { StateManager } from '../../src/core/engine/state-manager.js';
import { TaskManager } from '../../src/core/engine/task-manager.js';

describe('TaskManager', () => {
  let tmpDir: string;
  let fileSystem: FileSystem;
  let stateManager: StateManager;
  let taskManager: TaskManager;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'continuity-task-test-'));
    fileSystem = new FileSystem(tmpDir);
    stateManager = new StateManager(fileSystem);
    taskManager = new TaskManager(fileSystem, stateManager);
    await fileSystem.ensureDir(fileSystem.continuityDir);
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('manages task lifecycle (start, update, complete)', async () => {
    // 1. Start task
    const task = await taskManager.startTask('Refresh token rotation', {
      description: 'Add refresh tokens with atomic rotation',
      remaining: ['Endpoint', 'Transaction wrapper', 'Tests'],
      relatedFiles: ['src/auth/refresh.ts']
    });

    expect(task.id).toBe('refresh-token-rotation');
    expect(task.status).toBe('active');
    expect(task.progress).toBe(0);

    // Verify state.md synced
    let state = await stateManager.getState();
    expect(state.currentTask).toBe('Refresh token rotation');
    expect(state.progress).toBe(0);

    // 2. Update task progress
    await taskManager.updateTask(task.id, {
      progress: 60,
      addCompleted: ['Endpoint'],
      removeRemaining: ['Endpoint']
    });

    const updatedTask = await taskManager.getTask(task.id);
    expect(updatedTask?.progress).toBe(60);
    expect(updatedTask?.completed).toContain('Endpoint');
    expect(updatedTask?.remaining).not.toContain('Endpoint');

    state = await stateManager.getState();
    expect(state.progress).toBe(60);
    expect(state.completed).toContain('Endpoint');

    // 3. Complete task
    await taskManager.completeTask(task.id, 'Finished integration tests');
    const completedTask = await taskManager.getTask(task.id);
    expect(completedTask?.status).toBe('completed');
    expect(completedTask?.progress).toBe(100);

    const taskList = await taskManager.listTasks();
    expect(taskList.active.length).toBe(0);
    expect(taskList.completed.length).toBe(1);
  });
});
