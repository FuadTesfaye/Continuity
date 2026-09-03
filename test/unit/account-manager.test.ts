import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { GlobalFileSystem } from '../../src/core/global/global-file-system.js';
import { AccountManager } from '../../src/core/global/account-manager.js';

describe('AccountManager', () => {
  let tmpGlobalDir: string;
  let gfs: GlobalFileSystem;
  let acctMgr: AccountManager;

  beforeEach(async () => {
    tmpGlobalDir = await fs.mkdtemp(path.join(os.tmpdir(), 'continuity-acct-test-'));
    gfs = new GlobalFileSystem(tmpGlobalDir);
    acctMgr = new AccountManager(gfs);
  });

  afterEach(async () => {
    await fs.rm(tmpGlobalDir, { recursive: true, force: true });
  });

  it('manages account profiles and preserves zero-secret guarantees', async () => {
    await acctMgr.setAccountProfile({
      provider: 'github',
      profile: 'work',
      username: 'fuad-enterprise',
      email: 'fuad@enterprise.com',
      credentialRef: 'keychain://github/work',
      status: 'authenticated',
      scopes: ['repo', 'read:org'],
      updatedAt: new Date().toISOString()
    });

    const accounts = await acctMgr.listAccounts('github');
    expect(accounts.length).toBeGreaterThanOrEqual(1);

    const workAcct = accounts.find((a) => a.profile === 'work');
    expect(workAcct).toBeDefined();
    expect(workAcct?.credentialRef).toBe('keychain://github/work');

    // AI Safe Metadata check: Never leaks credentialRef to AI models
    const aiSafe = acctMgr.getAiSafeMetadata(workAcct!);
    expect(aiSafe.username).toBe('fuad-enterprise');
    expect(aiSafe.profile).toBe('work');
    expect((aiSafe as any).credentialRef).toBeUndefined();
    expect((aiSafe as any).token).toBeUndefined();
  });
});
