import path from 'node:path';
import { TaskItem, TaskItemSchema, TaskStatus } from '../types/task.js';
import { FileSystem } from '../storage/file-system.js';
import { MarkdownHelper } from '../storage/markdown.js';
import { StateManager } from './state-manager.js';

export class TaskManager {
  constructor(
    private readonly fs: FileSystem,
    private readonly stateManager: StateManager
  ) {}

  private slugify(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
  }

  private getTaskDir(status: TaskStatus): string {
    if (status === 'completed') return this.fs.resolveContinuity('tasks', 'completed');
    if (status === 'blocked') return this.fs.resolveContinuity('tasks', 'blocked');
    return this.fs.resolveContinuity('tasks', 'active');
  }

  async startTask(
    title: string,
    options: {
      description?: string;
      remaining?: string[];
      relatedFiles?: string[];
    } = {}
  ): Promise<TaskItem> {
    const id = this.slugify(title);
    const now = new Date().toISOString();

    const task: TaskItem = {
      id,
      title,
      status: 'active',
      progress: 0,
      description: options.description || '',
      completed: [],
      remaining: options.remaining || [],
      blockers: [],
      relatedFiles: options.relatedFiles || [],
      createdAt: now,
      updatedAt: now
    };

    await this.saveTaskFile(task);

    // Sync with state.md
    await this.stateManager.saveState({
      currentTask: title,
      status: 'In progress — 0%',
      progress: 0,
      completed: [],
      remaining: options.remaining || [],
      currentFiles: options.relatedFiles || [],
      currentBlocker: null,
      lastAction: `Started task: ${title}`
    });

    return task;
  }

  async updateTask(
    id: string,
    updates: {
      progress?: number;
      addCompleted?: string[];
      addRemaining?: string[];
      removeRemaining?: string[];
      blocker?: string | null;
      relatedFiles?: string[];
    }
  ): Promise<TaskItem> {
    const task = await this.getTask(id);
    if (!task) {
      throw new Error(`Task with id '${id}' not found.`);
    }

    if (updates.progress !== undefined) {
      task.progress = Math.min(100, Math.max(0, updates.progress));
    }

    if (updates.addCompleted) {
      task.completed = Array.from(new Set([...task.completed, ...updates.addCompleted]));
      // Automatically remove from remaining if present
      task.remaining = task.remaining.filter((r) => !updates.addCompleted!.includes(r));
    }

    if (updates.addRemaining) {
      task.remaining = Array.from(new Set([...task.remaining, ...updates.addRemaining]));
    }

    if (updates.removeRemaining) {
      task.remaining = task.remaining.filter((r) => !updates.removeRemaining!.includes(r));
    }

    if (updates.blocker !== undefined) {
      if (updates.blocker) {
        task.blockers = Array.from(new Set([...task.blockers, updates.blocker]));
      }
    }

    if (updates.relatedFiles) {
      task.relatedFiles = Array.from(new Set([...task.relatedFiles, ...updates.relatedFiles]));
    }

    task.updatedAt = new Date().toISOString();
    await this.saveTaskFile(task);

    // Sync with state.md
    await this.stateManager.saveState({
      currentTask: task.title,
      progress: task.progress,
      status: `In progress — ${task.progress}%`,
      completed: task.completed,
      remaining: task.remaining,
      currentFiles: task.relatedFiles,
      currentBlocker: updates.blocker !== undefined ? updates.blocker : undefined,
      lastAction: `Updated task: ${task.title}`
    });

    return task;
  }

  async completeTask(id: string, summary?: string): Promise<TaskItem> {
    const task = await this.getTask(id);
    if (!task) {
      throw new Error(`Task with id '${id}' not found.`);
    }

    const previousStatus = task.status;
    task.status = 'completed';
    task.progress = 100;
    task.completedAt = new Date().toISOString();
    task.updatedAt = task.completedAt;

    if (summary) {
      task.completed = Array.from(new Set([...task.completed, summary]));
    }

    // Move file to completed/
    const oldPath = path.join(this.getTaskDir(previousStatus), `${task.id}.md`);
    const newPath = path.join(this.getTaskDir('completed'), `${task.id}.md`);

    await this.fs.ensureDir(this.getTaskDir('completed'));
    const content = this.formatTaskMarkdown(task);

    if (this.fs.exists(oldPath) && oldPath !== newPath) {
      await this.fs.deleteFile(oldPath);
    }
    await this.fs.writeFile(newPath, content);

    // Update state.md
    await this.stateManager.saveState({
      currentTask: `Completed: ${task.title}`,
      progress: 100,
      status: 'Completed',
      currentBlocker: null,
      lastAction: `Completed task: ${task.title}`
    });

    return task;
  }

  async blockTask(id: string, reason: string): Promise<TaskItem> {
    const task = await this.getTask(id);
    if (!task) {
      throw new Error(`Task with id '${id}' not found.`);
    }

    const previousStatus = task.status;
    task.status = 'blocked';
    task.blockers = Array.from(new Set([...task.blockers, reason]));
    task.updatedAt = new Date().toISOString();

    const oldPath = path.join(this.getTaskDir(previousStatus), `${task.id}.md`);
    const newPath = path.join(this.getTaskDir('blocked'), `${task.id}.md`);

    await this.fs.ensureDir(this.getTaskDir('blocked'));
    const content = this.formatTaskMarkdown(task);

    if (this.fs.exists(oldPath) && oldPath !== newPath) {
      await this.fs.deleteFile(oldPath);
    }
    await this.fs.writeFile(newPath, content);

    await this.stateManager.saveState({
      status: 'Blocked',
      currentBlocker: reason,
      lastAction: `Blocked task: ${task.title}`
    });

    return task;
  }

  async getTask(id: string): Promise<TaskItem | undefined> {
    const statuses: TaskStatus[] = ['active', 'blocked', 'completed'];
    for (const status of statuses) {
      const taskPath = path.join(this.getTaskDir(status), `${id}.md`);
      if (this.fs.exists(taskPath)) {
        const raw = await this.fs.readFile(taskPath);
        return this.parseTaskMarkdown(raw, id, status);
      }
    }
    return undefined;
  }

  async listTasks(): Promise<{ active: TaskItem[]; completed: TaskItem[]; blocked: TaskItem[] }> {
    const result = {
      active: [] as TaskItem[],
      completed: [] as TaskItem[],
      blocked: [] as TaskItem[]
    };

    const statuses: TaskStatus[] = ['active', 'completed', 'blocked'];
    for (const status of statuses) {
      const dir = this.getTaskDir(status);
      const files = await this.fs.listFiles(dir, '.md');
      for (const file of files) {
        const id = path.basename(file, '.md');
        const raw = await this.fs.readFile(file);
        const task = this.parseTaskMarkdown(raw, id, status);
        result[status].push(task);
      }
    }

    return result;
  }

  private saveTaskFile(task: TaskItem): Promise<void> {
    const dir = this.getTaskDir(task.status);
    const filePath = path.join(dir, `${task.id}.md`);
    const content = this.formatTaskMarkdown(task);
    return this.fs.writeFile(filePath, content);
  }

  private formatTaskMarkdown(task: TaskItem): string {
    const frontmatter = {
      id: task.id,
      title: task.title,
      status: task.status,
      progress: task.progress,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      completedAt: task.completedAt
    };

    const body = `# ${task.title}

## Description
${task.description || 'No description provided.'}

## Progress
${task.progress}%

## Completed
${MarkdownHelper.formatBulletList(task.completed, '✓')}

## Remaining
${MarkdownHelper.formatBulletList(task.remaining, '□')}

## Blockers
${MarkdownHelper.formatBulletList(task.blockers)}

## Related Files
${MarkdownHelper.formatBulletList(task.relatedFiles)}
`;

    return MarkdownHelper.stringify(body, frontmatter);
  }

  private parseTaskMarkdown(raw: string, id: string, fallbackStatus: TaskStatus): TaskItem {
    const parsed = MarkdownHelper.parse<any>(raw);
    const sections = MarkdownHelper.extractSections(parsed.content);

    const title = parsed.data.title || sections.get('Description') || id;
    const progress = typeof parsed.data.progress === 'number' ? parsed.data.progress : 0;
    const status = (parsed.data.status as TaskStatus) || fallbackStatus;

    return {
      id,
      title,
      status,
      progress,
      description: sections.get('Description') || '',
      completed: parsed.data.completed || MarkdownHelper.parseBulletList(sections.get('Completed') || ''),
      remaining: parsed.data.remaining || MarkdownHelper.parseBulletList(sections.get('Remaining') || ''),
      blockers: parsed.data.blockers || MarkdownHelper.parseBulletList(sections.get('Blockers') || ''),
      relatedFiles: parsed.data.relatedFiles || MarkdownHelper.parseBulletList(sections.get('Related Files') || ''),
      createdAt: parsed.data.createdAt || new Date().toISOString(),
      updatedAt: parsed.data.updatedAt || new Date().toISOString(),
      completedAt: parsed.data.completedAt
    };
  }
}
