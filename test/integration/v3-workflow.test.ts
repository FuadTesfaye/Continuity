import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { GlobalFileSystem } from '../../src/core/global/global-file-system.js';
import { FileSystem } from '../../src/core/storage/file-system.js';
import { DeviceDetector } from '../../src/core/global/device-detector.js';
import { ProjectRegistryManager } from '../../src/core/global/project-registry.js';
import { ToolchainManager } from '../../src/core/global/toolchain-manager.js';
import { BootstrapEngine } from '../../src/core/global/bootstrap-engine.js';
import { StateManager } from '../../src/core/engine/state-manager.js';
import { HandoverManager } from '../../src/core/engine/handover-manager.js';
import { SessionManager } from '../../src/core/engine/session-manager.js';
import { FailureManager } from '../../src/core/engine/failure-manager.js';
import { DecisionManager } from '../../src/core/engine/decision-manager.js';
import { PlanManager } from '../../src/core/engine/plan-manager.js';
import { GitClient } from '../../src/core/git/git-client.js';
import { ResumeEngine } from '../../src/core/engine/resume-engine.js';
import { DoctorEngine } from '../../src/core/engine/doctor-engine.js';
import { TaskManager } from '../../src/core/engine/task-manager.js';
import { DEFAULT_PROJECT_MD, DEFAULT_STATE_MD } from '../../src/templates/defaults.js';

describe('Continuity v3 Two-Memory End-to-End Workflow', () => {
  let tmpGlobalDir: string;
  let tmpProjectDir: string;
  let gfs: GlobalFileSystem;
  let pfs: FileSystem;

  beforeEach(async () => {
    tmpGlobalDir = await fs.mkdtemp(path.join(os.tmpdir(), 'continuity-v3-global-'));
    tmpProjectDir = await fs.mkdtemp(path.join(os.tmpdir(), 'continuity-v3-proj-'));
    gfs = new GlobalFileSystem(tmpGlobalDir);
    pfs = new FileSystem(tmpProjectDir);

    // Initialize global structure
    await gfs.initGlobalStructure();

    // Initialize local project structure
    await pfs.writeFile(
      pfs.resolveContinuity('project.md'),
      DEFAULT_PROJECT_MD('ACME Billing Service', 'ACME Corp billing service', ['Node.js', 'TypeScript'])
    );
    await pfs.writeFile(pfs.resolveContinuity('state.md'), DEFAULT_STATE_MD('ACME Billing Service'));
    await pfs.ensureDir(pfs.resolveContinuity('plans', 'active'));
    await pfs.ensureDir(pfs.resolveContinuity('tasks'));
    await pfs.ensureDir(pfs.resolveContinuity('sessions', 'summaries'));
    await pfs.ensureDir(pfs.resolveContinuity('decisions'));
    await pfs.ensureDir(pfs.resolveContinuity('failures'));
    await pfs.ensureDir(pfs.resolveContinuity('handovers'));

    // Write a mock package.json
    await pfs.writeFile(
      pfs.resolve('package.json'),
      JSON.stringify({
        name: 'acme-billing-service',
        engines: { node: '22.x' },
        packageManager: 'pnpm@10.0.0'
      })
    );
  });

  afterEach(async () => {
    await fs.rm(tmpGlobalDir, { recursive: true, force: true });
    await fs.rm(tmpProjectDir, { recursive: true, force: true });
  });

  it('coordinates global developer memory and local project memory seamlessly', async () => {
    // 1. Device detection & sync in ~/.continuity/
    const detector = new DeviceDetector(gfs);
    const syncedDevice = await detector.syncEnvironment();
    expect(syncedDevice.id).toBeTruthy();
    expect(gfs.exists(gfs.resolve('devices', `${syncedDevice.id}.yml`))).toBe(true);

    // 2. Project registration in global registry
    const registry = new ProjectRegistryManager(gfs);
    const registered = await registry.registerProject({
      name: 'ACME Billing Service',
      path: tmpProjectDir,
      type: 'client',
      client: 'Acme Corp',
      stack: ['Node.js', 'TypeScript', 'PostgreSQL']
    });
    expect(registered.type).toBe('client');
    expect(registered.client).toBe('Acme Corp');

    // 3. Hierarchical toolchain resolution
    const toolchainMgr = new ToolchainManager(gfs, pfs);
    const effective = await toolchainMgr.resolveEffectiveToolchain();
    expect(effective.runtime.source).toBe('project'); // Project package.json node: '22.x' wins!
    expect(effective.runtime.version).toBe('22.x');

    // 4. Create active plan in project
    const planMgr = new PlanManager(pfs);
    const plan = await planMgr.createPlan({
      title: 'Invoice Generation Engine',
      goal: 'Produce reliable multi-currency PDF invoices',
      steps: ['Template parser', 'Tax calculation', 'PDF renderer'],
      acceptanceCriteria: ['Supports EUR and USD', 'Renders under 200ms'],
      constraints: ['No external SaaS dependencies']
    });
    expect(plan.status).toBe('active');

    // 5. Scoped Resume Engine verification
    const git = new GitClient(tmpProjectDir);
    const stateMgr = new StateManager(pfs);
    const decisionMgr = new DecisionManager(pfs);
    const failureMgr = new FailureManager(pfs);
    const handoverMgr = new HandoverManager(pfs, git, stateMgr, decisionMgr, failureMgr);
    const sessionMgr = new SessionManager(pfs, stateMgr);

    const resumeEngine = new ResumeEngine(
      stateMgr,
      handoverMgr,
      sessionMgr,
      failureMgr,
      decisionMgr,
      git,
      planMgr,
      gfs
    );

    const context = await resumeEngine.buildContext({ scope: 'project' });
    expect(context.project).toBeTruthy();
    expect(context.plan?.id).toBe(plan.id);
    expect(context.environment?.runtime).toContain('node 22.x');

    const formattedCompact = resumeEngine.formatCompact(context);
    expect(formattedCompact).toContain('CONTINUITY RESUME');
    expect(formattedCompact).toContain('Active Plan: Invoice Generation Engine');

    // 6. Bootstrap verification
    const bootstrap = new BootstrapEngine(pfs, gfs);
    const bootReport = await bootstrap.checkEnvironment();
    expect(bootReport.projectName).toBe('acme-billing-service');
    expect(bootReport.checks.length).toBeGreaterThan(0);

    // 7. Doctor diagnostics verifying project & global drift
    const taskMgr = new TaskManager(pfs, stateMgr);
    const doctor = new DoctorEngine(pfs, git, stateMgr, taskMgr, gfs);
    const docReport = await doctor.runDiagnostics();

    expect(docReport.overallHealthy).toBe(true);
    const globalCheck = docReport.checks.find((c) => c.name.includes('Global Memory'));
    expect(globalCheck).toBeDefined();
    expect(globalCheck?.passed).toBe(true);
  });
});
