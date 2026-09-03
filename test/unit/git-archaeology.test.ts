import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { GitClient } from '../../src/core/git/git-client.js';

const execFileAsync = promisify(execFile);

describe('GitClient Archaeology & Context Levels', () => {
  let tmpDir: string;
  let git: GitClient;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'continuity-git-test-'));
    git = new GitClient(tmpDir);

    // Initialize real git repo
    await execFileAsync('git', ['init'], { cwd: tmpDir });
    await execFileAsync('git', ['branch', '-M', 'main'], { cwd: tmpDir });
    await execFileAsync('git', ['config', 'user.name', 'Test Author'], { cwd: tmpDir });
    await execFileAsync('git', ['config', 'user.email', 'test@example.com'], { cwd: tmpDir });

    // Commit 1
    await fs.writeFile(path.join(tmpDir, 'service.ts'), 'export function payment() { return 1; }\n');
    await execFileAsync('git', ['add', '.'], { cwd: tmpDir });
    await execFileAsync('git', ['commit', '-m', 'feat: introduce payment module'], { cwd: tmpDir });

    // Commit 2
    await fs.writeFile(path.join(tmpDir, 'service.ts'), 'export function payment() { return 1; }\nexport function retryPolicy() { return true; }\n');
    await execFileAsync('git', ['add', '.'], { cwd: tmpDir });
    await execFileAsync('git', ['commit', '-m', 'feat: add retryPolicy logic'], { cwd: tmpDir });

    // Tag
    await execFileAsync('git', ['tag', '-a', 'v1.0.0', '-m', 'Release 1.0.0'], { cwd: tmpDir });
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('inspects Level 1 git state', async () => {
    const status = await git.getStatus();
    expect(status.isGitRepo).toBe(true);
    expect(status.branch).toBe('main');
    expect(status.commit?.message).toBe('feat: add retryPolicy logic');
    expect(status.hasUncommittedChanges).toBe(false);
  });

  it('inspects Level 2 recent commits', async () => {
    const recent = await git.getRecentCommits(5);
    expect(recent.length).toBe(2);
    expect(recent[0].message).toBe('feat: add retryPolicy logic');
    expect(recent[1].message).toBe('feat: introduce payment module');
  });

  it('inspects Level 3 file history', async () => {
    const fileHistory = await git.getFileCommits('service.ts');
    expect(fileHistory.length).toBe(2);
  });

  it('executes Level 4 change archaeology (pickaxe -S)', async () => {
    const matches = await git.searchSymbolHistory('retryPolicy', 'service.ts');
    expect(matches.length).toBe(1);
    expect(matches[0].message).toBe('feat: add retryPolicy logic');
  });

  it('retrieves version tags and module evolution', async () => {
    const tags = await git.getTags();
    expect(tags.length).toBe(1);
    expect(tags[0].name).toBe('v1.0.0');

    const evolution = await git.getModuleEvolution('service.ts');
    expect(evolution.totalCommits).toBe(2);
    expect(evolution.releases.length).toBe(1);
    expect(evolution.releases[0].tag).toBe('v1.0.0');
  });
});
