import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export interface GitCommitInfo {
  hash: string;
  shortHash: string;
  message: string;
  author: string;
  date: string;
}

export interface GitStatusInfo {
  isGitRepo: boolean;
  branch: string;
  commit?: GitCommitInfo;
  modifiedFiles: string[];
  stagedFiles: string[];
  untrackedFiles: string[];
  hasUncommittedChanges: boolean;
}

export class GitClient {
  constructor(private readonly cwd: string = process.cwd()) {}

  private async runGit(args: string[]): Promise<string> {
    try {
      const { stdout } = await execFileAsync('git', args, { cwd: this.cwd });
      return stdout.trim();
    } catch {
      return '';
    }
  }

  async isGitRepository(): Promise<boolean> {
    const res = await this.runGit(['rev-parse', '--is-inside-work-tree']);
    return res === 'true';
  }

  async getCurrentBranch(): Promise<string> {
    const branch = await this.runGit(['branch', '--show-current']);
    if (branch) return branch;
    const fallback = await this.runGit(['rev-parse', '--abbrev-ref', 'HEAD']);
    return fallback || 'main';
  }

  async getLatestCommit(): Promise<GitCommitInfo | undefined> {
    const log = await this.runGit([
      'log',
      '-1',
      '--pretty=format:%H%x1f%h%x1f%s%x1f%an%x1f%ad',
      '--date=iso'
    ]);

    if (!log) return undefined;
    const parts = log.split('\x1f');
    if (parts.length < 5) return undefined;

    return {
      hash: parts[0],
      shortHash: parts[1],
      message: parts[2],
      author: parts[3],
      date: parts[4]
    };
  }

  async getStatus(): Promise<GitStatusInfo> {
    const isRepo = await this.isGitRepository();
    if (!isRepo) {
      return {
        isGitRepo: false,
        branch: 'unknown',
        modifiedFiles: [],
        stagedFiles: [],
        untrackedFiles: [],
        hasUncommittedChanges: false
      };
    }

    const branch = await this.getCurrentBranch();
    const commit = await this.getLatestCommit();

    const statusOutput = await this.runGit(['status', '--porcelain=v1']);
    const modifiedFiles: string[] = [];
    const stagedFiles: string[] = [];
    const untrackedFiles: string[] = [];

    if (statusOutput) {
      const lines = statusOutput.split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        const indexStatus = line.charAt(0);
        const workTreeStatus = line.charAt(1);
        const filePath = line.substring(3).trim();

        if (indexStatus === '?' && workTreeStatus === '?') {
          untrackedFiles.push(filePath);
        } else {
          if (indexStatus !== ' ' && indexStatus !== '?') {
            stagedFiles.push(filePath);
          }
          if (workTreeStatus !== ' ' && workTreeStatus !== '?') {
            modifiedFiles.push(filePath);
          }
        }
      }
    }

    const hasUncommittedChanges =
      modifiedFiles.length > 0 || stagedFiles.length > 0 || untrackedFiles.length > 0;

    return {
      isGitRepo: true,
      branch,
      commit,
      modifiedFiles: Array.from(new Set(modifiedFiles)),
      stagedFiles: Array.from(new Set(stagedFiles)),
      untrackedFiles: Array.from(new Set(untrackedFiles)),
      hasUncommittedChanges
    };
  }

  async getDiff(cached = false): Promise<string> {
    const args = ['diff'];
    if (cached) args.push('--cached');
    return this.runGit(args);
  }

  async getChangedFilesSince(commitHash?: string): Promise<string[]> {
    if (!commitHash) {
      const status = await this.getStatus();
      return [...status.modifiedFiles, ...status.stagedFiles];
    }
    const output = await this.runGit(['diff', '--name-only', `${commitHash}..HEAD`]);
    if (!output) return [];
    return output.split('\n').map((f) => f.trim()).filter(Boolean);
  }

  async getFileCommits(filePath: string, limit = 5): Promise<Array<{ hash: string; message: string; date: string }>> {
    const output = await this.runGit([
      'log',
      `-${limit}`,
      '--pretty=format:%h%x1f%s%x1f%ad',
      '--date=short',
      '--',
      filePath
    ]);

    if (!output) return [];
    return output
      .split('\n')
      .map((line) => {
        const [hash, message, date] = line.split('\x1f');
        return { hash, message, date };
      })
      .filter((c) => Boolean(c.hash));
  }
}
