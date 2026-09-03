import { GlobalFileSystem } from '../../core/global/global-file-system.js';
import { TerminalFormatter } from '../formatters/terminal.js';

export interface ProfileOptions {
  json?: boolean;
}

export async function runProfile(options: ProfileOptions = {}): Promise<void> {
  const gfs = new GlobalFileSystem();
  await gfs.initGlobalStructure();

  const devProfilePath = gfs.resolve('profile', 'developer.md');
  const prefsPath = gfs.resolve('profile', 'preferences.md');

  const devProfile = await gfs.readFile(devProfilePath);
  const prefs = await gfs.readFile(prefsPath);

  if (options.json) {
    console.log(
      JSON.stringify(
        {
          developerProfile: devProfile,
          preferences: prefs,
          globalPath: gfs.globalDir
        },
        null,
        2
      )
    );
    return;
  }

  TerminalFormatter.header('Global Developer Profile (~/.continuity)');
  console.log(devProfile);

  TerminalFormatter.section('DEVELOPER PREFERENCES');
  console.log(prefs);

  TerminalFormatter.item('Storage Location', gfs.globalDir);
}
