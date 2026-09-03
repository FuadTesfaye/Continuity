import path from 'node:path';
import { GitClient } from '../git/git-client.js';
import { TaskManager } from './task-manager.js';
import { DecisionManager } from './decision-manager.js';
import { FailureManager } from './failure-manager.js';
import { SessionManager } from './session-manager.js';
import { FileSystem } from '../storage/file-system.js';

export interface FileExplanation {
  filePath: string;
  exists: boolean;
  purpose: string;
  introducedDate?: string;
  introducedCommit?: string;
  lastModifiedDate?: string;
  lastModifiedCommit?: string;
  relatedTasks: string[];
  relatedDecisions: string[];
  knownFailures: string[];
  sessionMentionsCount: number;
}

export class ExplainEngine {
  constructor(
    private readonly fs: FileSystem,
    private readonly git: GitClient,
    private readonly taskManager: TaskManager,
    private readonly decisionManager: DecisionManager,
    private readonly failureManager: FailureManager,
    private readonly sessionManager: SessionManager
  ) {}

  async explain(targetPath: string): Promise<FileExplanation> {
    const fullPath = this.fs.resolve(targetPath);
    const relativePath = path.relative(this.fs.rootDir, fullPath);
    const exists = this.fs.exists(fullPath);

    // Git history inspection
    const commits = await this.git.getFileCommits(relativePath, 20);
    const lastCommit = commits[0];
    const firstCommit = commits[commits.length - 1];

    // Check tasks
    const allTasks = await this.taskManager.listTasks();
    const relatedTasks: string[] = [];
    for (const t of [...allTasks.active, ...allTasks.completed, ...allTasks.blocked]) {
      if (
        t.relatedFiles.some((f) => f.includes(relativePath) || relativePath.includes(f)) ||
        (t.description && t.description.includes(relativePath))
      ) {
        relatedTasks.push(`${t.title} (${t.status})`);
      }
    }

    // Check decisions
    const decisions = await this.decisionManager.listDecisions();
    const relatedDecisions: string[] = [];
    for (const d of decisions) {
      if (
        d.decision.includes(relativePath) ||
        d.why.includes(relativePath) ||
        d.title.toLowerCase().includes(path.basename(relativePath, path.extname(relativePath)).toLowerCase())
      ) {
        relatedDecisions.push(`${d.id}: ${d.title}`);
      }
    }

    // Check failures
    const failures = await this.failureManager.listFailures();
    const knownFailures: string[] = [];
    for (const f of failures) {
      if (
        f.relatedFiles.some((rf) => rf.includes(relativePath) || relativePath.includes(rf)) ||
        f.attempt.includes(relativePath) ||
        f.why.includes(relativePath)
      ) {
        knownFailures.push(`${f.title} (${f.doNotRepeat})`);
      }
    }

    // Check sessions
    const sessions = await this.sessionManager.listSessions();
    let sessionMentionsCount = 0;
    for (const s of sessions) {
      if (
        s.filesChanged.some((fc) => fc.includes(relativePath) || relativePath.includes(fc)) ||
        s.objective.includes(relativePath)
      ) {
        sessionMentionsCount++;
      }
    }

    // Derive purpose
    let purpose = 'General codebase module';
    if (relatedTasks.length > 0) {
      purpose = `Related to task: ${relatedTasks[0]}`;
    } else if (commits.length > 0) {
      purpose = `Created for: ${commits[commits.length - 1].message}`;
    }

    return {
      filePath: relativePath,
      exists,
      purpose,
      introducedDate: firstCommit?.date,
      introducedCommit: firstCommit?.hash,
      lastModifiedDate: lastCommit?.date,
      lastModifiedCommit: lastCommit?.hash,
      relatedTasks,
      relatedDecisions,
      knownFailures,
      sessionMentionsCount
    };
  }

  formatExplanation(exp: FileExplanation): string {
    const lines: string[] = [
      `File Context: ${exp.filePath}`,
      '--------------------------------------------------',
      `Exists on disk: ${exp.exists ? 'Yes' : 'No (historical reference)'}`,
      `Purpose: ${exp.purpose}`,
      `Introduced: ${exp.introducedDate || 'Unknown'} ${exp.introducedCommit ? `(${exp.introducedCommit})` : ''}`,
      `Last Modified: ${exp.lastModifiedDate || 'Unknown'} ${exp.lastModifiedCommit ? `(${exp.lastModifiedCommit})` : ''}`,
      `Related Tasks: ${exp.relatedTasks.length > 0 ? exp.relatedTasks.join(', ') : 'None directly tagged'}`,
      `Related Decisions: ${exp.relatedDecisions.length > 0 ? exp.relatedDecisions.join(', ') : 'None'}`,
      `Historical Sessions: ${exp.sessionMentionsCount} session(s) modified or mentioned this file`,
      `Known Issues/Failures: ${exp.knownFailures.length > 0 ? exp.knownFailures.join('; ') : 'None recorded'}`,
      '--------------------------------------------------'
    ];

    return lines.join('\n');
  }
}
