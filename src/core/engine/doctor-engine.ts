import { FileSystem } from '../storage/file-system.js';
import { GitClient } from '../git/git-client.js';
import { SecretRedactor } from '../security/redactor.js';
import { StateManager } from './state-manager.js';
import { TaskManager } from './task-manager.js';
import { GlobalFileSystem } from '../global/global-file-system.js';
import { DeviceDetector } from '../global/device-detector.js';

export interface DoctorCheck {
  name: string;
  passed: boolean;
  message: string;
  warning?: boolean;
}

export interface DoctorReport {
  overallHealthy: boolean;
  checks: DoctorCheck[];
}

export class DoctorEngine {
  private redactor: SecretRedactor;

  constructor(
    private readonly fs: FileSystem,
    private readonly git: GitClient,
    private readonly stateManager: StateManager,
    private readonly taskManager: TaskManager,
    private readonly globalFs?: GlobalFileSystem
  ) {
    this.redactor = new SecretRedactor();
  }

  async runDiagnostics(): Promise<DoctorReport> {
    const checks: DoctorCheck[] = [];

    // 1. Check directory structure
    const continuityExists = this.fs.exists(this.fs.continuityDir);
    checks.push({
      name: '.continuity directory',
      passed: continuityExists,
      message: continuityExists ? '.continuity directory exists' : 'Missing .continuity directory. Run continuity init.'
    });

    // 2. Check state.md
    const stateExists = this.fs.exists(this.fs.resolveContinuity('state.md'));
    if (stateExists) {
      try {
        const state = await this.stateManager.getState();
        checks.push({
          name: 'state.md valid',
          passed: true,
          message: `state.md is valid (Task: "${state.currentTask}", Progress: ${state.progress}%)`
        });
      } catch (err: any) {
        checks.push({
          name: 'state.md valid',
          passed: false,
          message: `state.md failed validation: ${err.message}`
        });
      }
    } else {
      checks.push({
        name: 'state.md valid',
        passed: false,
        message: 'state.md does not exist'
      });
    }

    // 3. Check project.md
    const projectExists = this.fs.exists(this.fs.resolveContinuity('project.md'));
    checks.push({
      name: 'project.md exists',
      passed: projectExists,
      message: projectExists ? 'project.md exists' : 'project.md is missing',
      warning: !projectExists
    });

    // 4. Check CONTINUITY.md protocol file
    const rootProtocolExists = this.fs.exists(this.fs.resolve('CONTINUITY.md'));
    checks.push({
      name: 'Root CONTINUITY.md protocol file',
      passed: rootProtocolExists,
      message: rootProtocolExists
        ? 'CONTINUITY.md protocol file is present at project root'
        : 'CONTINUITY.md missing from root. AIs may not auto-discover the system.',
      warning: !rootProtocolExists
    });

    // 5. Check Git
    const isGit = await this.git.isGitRepository();
    if (isGit) {
      const branch = await this.git.getCurrentBranch();
      checks.push({
        name: 'Git repository detected',
        passed: true,
        message: `Git repository active on branch: ${branch}`
      });
    } else {
      checks.push({
        name: 'Git repository detected',
        passed: false,
        message: 'Not inside a Git repository. Version tracking is disabled.',
        warning: true
      });
    }

    // 6. Check Tasks
    try {
      const tasks = await this.taskManager.listTasks();
      const totalTasks = tasks.active.length + tasks.completed.length + tasks.blocked.length;
      checks.push({
        name: 'Task tracking integrity',
        passed: true,
        message: `${totalTasks} task(s) found (${tasks.active.length} active, ${tasks.completed.length} completed, ${tasks.blocked.length} blocked)`
      });
    } catch (err: any) {
      checks.push({
        name: 'Task tracking integrity',
        passed: false,
        message: `Error reading tasks: ${err.message}`
      });
    }

    // 7. Check for unredacted secrets in .continuity
    if (continuityExists) {
      const markdownFiles = await this.fs.listFiles(this.fs.continuityDir, '.md');
      let leakedSecrets = 0;
      const leakedFiles: string[] = [];

      for (const file of markdownFiles) {
        // Skip cache
        if (file.includes('/cache/')) continue;
        const content = await this.fs.readFile(file);
        const scan = this.redactor.redact(content);
        if (scan.redactedCount > 0) {
          leakedSecrets += scan.redactedCount;
          leakedFiles.push(file);
        }
      }

      checks.push({
        name: 'Secret scanning',
        passed: leakedSecrets === 0,
        message:
          leakedSecrets === 0
            ? 'No unredacted secrets or credentials detected in .continuity/'
            : `WARNING: Found ${leakedSecrets} potential raw secret(s) in: ${leakedFiles.join(', ')}`,
        warning: leakedSecrets > 0
      });
    }

    // 8. Global Memory & Environment Drift Checks
    if (this.globalFs) {
      const gInitialized = this.globalFs.isInitialized();
      checks.push({
        name: 'Global Memory (~/.continuity)',
        passed: gInitialized,
        message: gInitialized
          ? `Global memory is active at ${this.globalFs.globalDir}`
          : `Global memory not initialized. Run "continuity device --sync" or "continuity profile"`,
        warning: !gInitialized
      });

      if (gInitialized) {
        try {
          const detector = new DeviceDetector(this.globalFs);
          const drifts = await detector.detectDrift();
          if (drifts.length > 0) {
            const driftMsgs = drifts.map((d) => `${d.tool}: stored ${d.storedVersion} -> live ${d.currentVersion}`).join('; ');
            checks.push({
              name: 'Environment Drift',
              passed: false,
              message: `Drift detected (${driftMsgs}). Run "continuity device --sync" to update`,
              warning: true
            });
          } else {
            checks.push({
              name: 'Environment Drift',
              passed: true,
              message: 'Machine environment matches stored device snapshot'
            });
          }
        } catch {}
      }
    }

    const overallHealthy = checks.every((c) => c.passed || c.warning);

    return {
      overallHealthy,
      checks
    };
  }
}
