import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { GlobalFileSystem } from '../../src/core/global/global-file-system.js';
import { ProjectRegistryManager } from '../../src/core/global/project-registry.js';

describe('ProjectRegistryManager', () => {
  let tmpGlobalDir: string;
  let gfs: GlobalFileSystem;
  let registry: ProjectRegistryManager;

  beforeEach(async () => {
    tmpGlobalDir = await fs.mkdtemp(path.join(os.tmpdir(), 'continuity-reg-test-'));
    gfs = new GlobalFileSystem(tmpGlobalDir);
    registry = new ProjectRegistryManager(gfs);
  });

  afterEach(async () => {
    await fs.rm(tmpGlobalDir, { recursive: true, force: true });
  });

  it('registers projects across multiple categories and lists them', async () => {
    await registry.registerProject({
      name: 'Personal Site',
      path: '/home/dev/Personal/site',
      type: 'personal',
      stack: ['Astro', 'Tailwind']
    });

    await registry.registerProject({
      name: 'Client Acme ERP',
      path: '/home/dev/Clients/Acme',
      type: 'client',
      client: 'Acme Corp',
      stack: ['Next.js', 'PostgreSQL']
    });

    await registry.registerProject({
      name: 'Continuity',
      path: '/home/dev/OpenSource/continuity',
      type: 'open-source',
      stack: ['TypeScript', 'Node.js']
    });

    const all = await registry.listProjects();
    expect(all.length).toBe(3);

    const clientProjects = await registry.listProjects('client');
    expect(clientProjects.length).toBe(1);
    expect(clientProjects[0].client).toBe('Acme Corp');

    const openSource = await registry.listProjects('open-source');
    expect(openSource.length).toBe(1);
    expect(openSource[0].name).toBe('Continuity');
  });

  it('classifies project type and validates client isolation boundary', async () => {
    const p1 = await registry.registerProject({
      name: 'Client Alpha',
      path: '/projects/client-alpha',
      type: 'client',
      client: 'Alpha Inc'
    });

    const p2 = await registry.registerProject({
      name: 'Client Beta',
      path: '/projects/client-beta',
      type: 'client',
      client: 'Beta Ltd'
    });

    // Cross-client boundary violation
    const isAllowed = registry.validateClientIsolation(p1, p2);
    expect(isAllowed).toBe(false);

    // Same client allowed
    const isSameAllowed = registry.validateClientIsolation(p1, p1);
    expect(isSameAllowed).toBe(true);
  });
});
