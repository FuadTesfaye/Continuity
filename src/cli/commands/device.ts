import { GlobalFileSystem } from '../../core/global/global-file-system.js';
import { DeviceDetector } from '../../core/global/device-detector.js';
import { TerminalFormatter } from '../formatters/terminal.js';

export interface DeviceOptions {
  sync?: boolean;
  json?: boolean;
}

export async function runDevice(options: DeviceOptions = {}): Promise<void> {
  const gfs = new GlobalFileSystem();
  await gfs.initGlobalStructure();

  const detector = new DeviceDetector(gfs);

  if (options.sync) {
    const synced = await detector.syncEnvironment();
    TerminalFormatter.success(`Device environment synchronized to ~/.continuity/devices/${synced.id}.yml`);
    TerminalFormatter.item('Hostname', synced.hostname);
    TerminalFormatter.item('OS', synced.os.name);
    TerminalFormatter.item('Architecture', synced.os.arch);
    TerminalFormatter.item('Node Version', synced.runtimes.node || 'None');
    TerminalFormatter.item('Package Manager', synced.packageManager);
    return;
  }

  const live = await detector.probeEnvironment();
  const stored = await detector.getStoredEnvironment();
  const drifts = await detector.detectDrift();

  if (options.json) {
    console.log(JSON.stringify({ live, stored, drifts }, null, 2));
    return;
  }

  TerminalFormatter.header(`Device Environment: ${live.hostname}`);

  TerminalFormatter.section('SYSTEM HARDWARE & OS');
  TerminalFormatter.item('Operating System', live.os.name);
  TerminalFormatter.item('Platform', live.os.platform);
  TerminalFormatter.item('Architecture', live.os.arch);
  TerminalFormatter.item('Kernel Release', live.os.release);
  TerminalFormatter.item('Active Shell', live.shell || 'Default');
  TerminalFormatter.item('Default Editor', live.defaultEditor || 'Default');

  TerminalFormatter.section('DETECTED RUNTIMES');
  for (const [rt, ver] of Object.entries(live.runtimes)) {
    TerminalFormatter.item(rt, ver);
  }

  TerminalFormatter.section('INSTALLED TOOLS & SERVICES');
  for (const [t, ver] of Object.entries(live.tools)) {
    TerminalFormatter.item(t, ver);
  }

  if (drifts.length > 0) {
    TerminalFormatter.section('ENVIRONMENT DRIFT DETECTED');
    for (const d of drifts) {
      TerminalFormatter.warning(
        `${d.tool}: stored ${d.storedVersion} -> current live ${d.currentVersion}`
      );
    }
    console.log('\nRun "continuity device --sync" to update stored device memory.');
  } else if (stored) {
    TerminalFormatter.section('HEALTH & SYNC STATUS');
    TerminalFormatter.success('Live environment matches stored device snapshot.');
  } else {
    TerminalFormatter.section('INITIALIZATION');
    console.log('No snapshot stored yet. Run "continuity device --sync" to persist.');
  }
}
