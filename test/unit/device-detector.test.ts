import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { GlobalFileSystem } from '../../src/core/global/global-file-system.js';
import { DeviceDetector } from '../../src/core/global/device-detector.js';

describe('DeviceDetector', () => {
  let tmpGlobalDir: string;
  let gfs: GlobalFileSystem;
  let detector: DeviceDetector;

  beforeEach(async () => {
    tmpGlobalDir = await fs.mkdtemp(path.join(os.tmpdir(), 'continuity-dev-test-'));
    gfs = new GlobalFileSystem(tmpGlobalDir);
    detector = new DeviceDetector(gfs);
  });

  afterEach(async () => {
    await fs.rm(tmpGlobalDir, { recursive: true, force: true });
  });

  it('probes live environment and detects node runtime and os architecture', async () => {
    const live = await detector.probeEnvironment();

    expect(live.hostname).toBeTruthy();
    expect(live.os.arch).toBe(os.arch());
    expect(live.runtimes.node).toBeTruthy();
    expect(live.tools.git).toBeTruthy();
  }, 15000);

  it('synchronizes device snapshot and detects version drift', async () => {
    const synced = await detector.syncEnvironment();
    expect(synced.id).toBeTruthy();

    const stored = await detector.getStoredEnvironment(synced.id);
    expect(stored).toBeDefined();
    expect(stored?.hostname).toBe(synced.hostname);

    // Simulated drift test
    if (stored) {
      stored.runtimes.node = '18.0.0'; // simulate old node version
      await gfs.writeYaml(gfs.resolve('devices', `${synced.id}.yml`), stored);

      const drifts = await detector.detectDrift(synced.id);
      expect(drifts.length).toBeGreaterThan(0);
      const nodeDrift = drifts.find((d) => d.tool === 'node');
      expect(nodeDrift).toBeDefined();
      expect(nodeDrift?.storedVersion).toBe('18.0.0');
      expect(nodeDrift?.driftDetected).toBe(true);
    }
  }, 15000);
});
