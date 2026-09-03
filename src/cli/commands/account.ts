import { GlobalFileSystem } from '../../core/global/global-file-system.js';
import { AccountManager } from '../../core/global/account-manager.js';
import { TerminalFormatter } from '../formatters/terminal.js';

export interface AccountOptions {
  provider?: string;
  json?: boolean;
}

export async function runAccount(options: AccountOptions = {}): Promise<void> {
  const gfs = new GlobalFileSystem();
  await gfs.initGlobalStructure();

  const manager = new AccountManager(gfs);
  const accounts = await manager.listAccounts(options.provider);

  if (options.json) {
    // Only export AI-safe metadata
    console.log(JSON.stringify(accounts.map((a) => manager.getAiSafeMetadata(a)), null, 2));
    return;
  }

  TerminalFormatter.header('Developer Account Profiles (~/.continuity/accounts)');

  if (accounts.length === 0) {
    console.log('No account profiles configured yet.');
    console.log('Configured in ~/.continuity/accounts/profiles.yml');
    return;
  }

  // Group by provider
  const grouped: Record<string, typeof accounts> = {};
  for (const a of accounts) {
    if (!grouped[a.provider]) grouped[a.provider] = [];
    grouped[a.provider].push(a);
  }

  for (const [provider, list] of Object.entries(grouped)) {
    TerminalFormatter.section(provider.toUpperCase());
    for (const a of list) {
      console.log(`  • Profile: ${a.profile}`);
      console.log(`    Username: ${a.username}`);
      if (a.email) console.log(`    Email: ${a.email}`);
      console.log(`    Status: ${a.status === 'authenticated' ? '✓ Authenticated' : '⚠ Unauthenticated'}`);
      console.log(`    Credential: ${a.credentialRef} (Secure Keychain Reference)`);
    }
  }

  TerminalFormatter.box('Zero-Plaintext Guarantee', [
    'Continuity stores only secure keychain references.',
    'Plaintext tokens/passwords are NEVER saved in markdown or sent to AI models.'
  ]);
}
