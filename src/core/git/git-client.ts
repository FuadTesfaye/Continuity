import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export interface GitCommitInfo {
  hash: string;
  shortHash: string;
  message: string;
  author: string;
  date: string;
  filesChanged?: string[];
}

export interface GitStatusInfo {
  isGitRepo: boolean;
  branch: string;
  commit?: GitCommitInfo;
  modifiedFiles: string[];
  stagedFiles: string[];
  untrackedFiles: string[];
  hasUncommittedChanges: boolean;
  stats?: {
    filesChanged: number;
    insertions: number;
    deletions: number;
  };
}

export interface GitTagInfo {
  name: string;
  commit: string;
  date: string;
  message?: string;
}

export interface GitBlameLine {
  lineNum: number;
  commit: string;
  author: string;
  date: string;
  content: string;
}

export interface ModuleEvolution {
  modulePath: string;
  totalCommits: number;
  releases: Array<{
    tag: string;
    date: string;
    commits: GitCommitInfo[];
  }>;
  recentCommits: GitCommitInfo[];
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

    // Diff stat
    let stats: { filesChanged: number; insertions: number; deletions: number } | undefined;
    const diffStat = await this.runGit(['diff', '--shortstat']);
    if (diffStat) {
      const filesMatch = diffStat.match(/(\d+)\s+file/);
      const insMatch = diffStat.match(/(\d+)\s+insertion/);
      const delMatch = diffStat.match(/(\d+)\s+deletion/);
      stats = {
        filesChanged: filesMatch ? parseInt(filesMatch[1], 10) : 0,
        insertions: insMatch ? parseInt(insMatch[1], 10) : 0,
        deletions: delMatch ? parseInt(delMatch[1], 10) : 0
      };
    }

    return {
      isGitRepo: true,
      branch,
      commit,
      modifiedFiles: Array.from(new Set(modifiedFiles)),
      stagedFiles: Array.from(new Set(stagedFiles)),
      untrackedFiles: Array.from(new Set(untrackedFiles)),
      hasUncommittedChanges,
      stats
    };
  }

  // Level 2: Recent History
  async getRecentCommits(limit = 15, filterPath?: string): Promise<GitCommitInfo[]> {
    const args = [
      'log',
      `-${limit}`,
      '--pretty=format:%H%x1f%h%x1f%s%x1f%an%x1f%ad',
      '--date=short'
    ];
    if (filterPath) {
      args.push('--', filterPath);
    }

    const output = await this.runGit(args);
    if (!output) return [];

    const commits: GitCommitInfo[] = [];
    for (const line of output.split('\n')) {
      if (!line.trim()) continue;
      const parts = line.split('\x1f');
      if (parts.length >= 5) {
        commits.push({
          hash: parts[0],
          shortHash: parts[1],
          message: parts[2],
          author: parts[3],
          date: parts[4]
        });
      }
    }

    return commits;
  }

  // Level 3: File Temporal History
  async getFileCommits(filePath: string, limit = 10): Promise<GitCommitInfo[]> {
    return this.getRecentCommits(limit, filePath);
  }

  // Level 4: Change Archaeology (Pickaxe -S)
  async searchSymbolHistory(symbol: string, filterPath?: string, limit = 10): Promise<GitCommitInfo[]> {
    const args = [
      'log',
      `-${limit}`,
      `-S${symbol}`,
      '--pretty=format:%H%x1f%h%x1f%s%x1f%an%x1f%ad',
      '--date=short'
    ];
    if (filterPath) {
      args.push('--', filterPath);
    }

    const output = await this.runGit(args);
    if (!output) return [];

    return output
      .split('\n')
      .map((line) => {
        const parts = line.split('\x1f');
        if (parts.length < 5) return null;
        return {
          hash: parts[0],
          shortHash: parts[1],
          message: parts[2],
          author: parts[3],
          date: parts[4]
        };
      })
      .filter((c): c is GitCommitInfo => c !== null);
  }

  // Level 4: Change Archaeology (Regex -G)
  async searchRegexHistory(regexPattern: string, filterPath?: string, limit = 10): Promise<GitCommitInfo[]> {
    const args = [
      'log',
      `-${limit}`,
      `-G${regexPattern}`,
      '--pretty=format:%H%x1f%h%x1f%s%x1f%an%x1f%ad',
      '--date=short'
    ];
    if (filterPath) {
      args.push('--', filterPath);
    }

    const output = await this.runGit(args);
    if (!output) return [];

    return output
      .split('\n')
      .map((line) => {
        const parts = line.split('\x1f');
        if (parts.length < 5) return null;
        return {
          hash: parts[0],
          shortHash: parts[1],
          message: parts[2],
          author: parts[3],
          date: parts[4]
        };
      })
      .filter((c): c is GitCommitInfo => c !== null);
  }

  // Level 4: Blame
  async getFileBlame(filePath: string, lineStart?: number, lineEnd?: number): Promise<GitBlameLine[]> {
    const args = ['blame', '--porcelain'];
    if (lineStart !== undefined && lineEnd !== undefined) {
      args.push(`-L${lineStart},${lineEnd}`);
    }
    args.push('--', filePath);

    const output = await this.runGit(args);
    if (!output) return [];

    const lines = output.split('\n');
    const result: GitBlameLine[] = [];
    let currentCommit = '';
    let currentAuthor = '';
    let currentDate = '';
    let lineNum = 1;

    for (const line of lines) {
      if (line.match(/^[a-f0-9]{40}/)) {
        currentCommit = line.split(' ')[0].substring(0, 7);
      } else if (line.startsWith('author ')) {
        currentAuthor = line.replace(/^author\s+/, '');
      } else if (line.startsWith('author-time ')) {
        const timestamp = parseInt(line.replace(/^author-time\s+/, ''), 10);
        currentDate = new Date(timestamp * 1000).toISOString().split('T')[0];
      } else if (line.startsWith('\t')) {
        result.push({
          lineNum: lineNum++,
          commit: currentCommit,
          author: currentAuthor,
          date: currentDate,
          content: line.substring(1)
        });
      }
    }

    return result;
  }

  // Commit Details
  async getCommitDetails(hash: string): Promise<{ info: GitCommitInfo; stat: string } | undefined> {
    const output = await this.runGit([
      'show',
      hash,
      '--stat',
      '--pretty=format:%H%x1f%h%x1f%s%x1f%an%x1f%ad'
    ]);

    if (!output) return undefined;
    const splitIndex = output.indexOf('\n');
    const header = splitIndex !== -1 ? output.substring(0, splitIndex) : output;
    const stat = splitIndex !== -1 ? output.substring(splitIndex + 1).trim() : '';

    const parts = header.split('\x1f');
    if (parts.length < 5) return undefined;

    return {
      info: {
        hash: parts[0],
        shortHash: parts[1],
        message: parts[2],
        author: parts[3],
        date: parts[4]
      },
      stat
    };
  }

  // Tags & Releases
  async getTags(): Promise<GitTagInfo[]> {
    const output = await this.runGit([
      'tag',
      '-l',
      '--sort=-creatordate',
      '--format=%(refname:short)%09%(objectname:short)%09%(creatordate:short)%09%(contents:subject)'
    ]);

    if (!output) return [];
    return output
      .split('\n')
      .filter((l) => l.trim())
      .map((line) => {
        const parts = line.split('\t');
        return {
          name: parts[0],
          commit: parts[1],
          date: parts[2],
          message: parts[3]
        };
      });
  }

  // Module Evolution across tags and commits
  async getModuleEvolution(modulePath: string): Promise<ModuleEvolution> {
    const recentCommits = await this.getRecentCommits(30, modulePath);
    const tags = await this.getTags();
    const releases: Array<{ tag: string; date: string; commits: GitCommitInfo[] }> = [];

    // Tag boundaries
    for (const tag of tags.slice(0, 5)) {
      const tagCommits = await this.runGit([
        'log',
        '-5',
        '--pretty=format:%H%x1f%h%x1f%s%x1f%an%x1f%ad',
        '--date=short',
        tag.name,
        '--',
        modulePath
      ]);

      if (tagCommits) {
        const parsedCommits = tagCommits
          .split('\n')
          .filter(Boolean)
          .map((l) => {
            const parts = l.split('\x1f');
            return {
              hash: parts[0],
              shortHash: parts[1],
              message: parts[2],
              author: parts[3],
              date: parts[4]
            };
          });

        if (parsedCommits.length > 0) {
          releases.push({
            tag: tag.name,
            date: tag.date,
            commits: parsedCommits
          });
        }
      }
    }

    return {
      modulePath,
      totalCommits: recentCommits.length,
      releases,
      recentCommits: recentCommits.slice(0, 10)
    };
  }

  // Diff
  async getDiff(cached = false): Promise<string> {
    const args = ['diff'];
    if (cached) args.push('--cached');
    return this.runGit(args);
  }

  async getContextDiff(files?: string[], limitLines = 50): Promise<string> {
    const args = ['diff', '--stat'];
    if (files && files.length > 0) {
      args.push('--', ...files);
    }
    const stat = await this.runGit(args);

    const diffArgs = ['diff', '-U2'];
    if (files && files.length > 0) {
      diffArgs.push('--', ...files);
    }
    const diff = await this.runGit(diffArgs);

    const diffLines = diff.split('\n').slice(0, limitLines).join('\n');
    return `${stat}\n\n${diffLines}`;
  }
}
