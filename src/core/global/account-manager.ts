import { GlobalFileSystem } from './global-file-system.js';
import {
  AccountProfile,
  AccountRegistry,
  AccountRegistrySchema
} from '../types/global.js';

export class AccountManager {
  constructor(private readonly gfs: GlobalFileSystem) {}

  private get accountsFile(): string {
    return this.gfs.resolve('accounts', 'profiles.yml');
  }

  async getRegistry(): Promise<AccountRegistry> {
    await this.gfs.initGlobalStructure();
    const data = await this.gfs.readYaml<AccountRegistry>(this.accountsFile);
    if (!data) {
      const initial: AccountRegistry = {
        version: '1.0',
        updatedAt: new Date().toISOString(),
        accounts: {}
      };
      await this.gfs.writeYaml(this.accountsFile, initial);
      return initial;
    }
    return AccountRegistrySchema.parse(data);
  }

  async listAccounts(provider?: string): Promise<AccountProfile[]> {
    const reg = await this.getRegistry();
    const list: AccountProfile[] = [];

    for (const provKey of Object.keys(reg.accounts)) {
      if (provider && provKey !== provider) continue;
      for (const profileKey of Object.keys(reg.accounts[provKey])) {
        list.push(reg.accounts[provKey][profileKey]);
      }
    }

    return list;
  }

  async getAccount(provider: string, profile: string): Promise<AccountProfile | undefined> {
    const reg = await this.getRegistry();
    return reg.accounts[provider]?.[profile];
  }

  async setAccountProfile(profile: AccountProfile): Promise<AccountProfile> {
    const reg = await this.getRegistry();
    if (!reg.accounts[profile.provider]) {
      reg.accounts[profile.provider] = {};
    }
    reg.accounts[profile.provider][profile.profile] = profile;
    reg.updatedAt = new Date().toISOString();
    await this.gfs.writeYaml(this.accountsFile, reg);
    return profile;
  }

  // AI-Safe Sanitization: Never expose credential references or tokens to LLMs
  getAiSafeMetadata(profile: AccountProfile): {
    provider: string;
    profile: string;
    username: string;
    status: string;
  } {
    return {
      provider: profile.provider,
      profile: profile.profile,
      username: profile.username,
      status: profile.status
    };
  }
}
