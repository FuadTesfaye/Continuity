import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { FileSystem } from '../../src/core/storage/file-system.js';
import { DecisionManager } from '../../src/core/engine/decision-manager.js';

describe('DecisionManager', () => {
  let tmpDir: string;
  let fileSystem: FileSystem;
  let decisionManager: DecisionManager;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'continuity-decision-test-'));
    fileSystem = new FileSystem(tmpDir);
    decisionManager = new DecisionManager(fileSystem);
    await fileSystem.ensureDir(fileSystem.continuityDir);
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('records and increments sequential ADR IDs', async () => {
    const adr1 = await decisionManager.recordDecision({
      title: 'Use RabbitMQ for Events',
      decision: 'Use RabbitMQ for inter-service asynchronous communication.',
      why: 'Independent consumers need events.',
      alternatives: ['Kafka', 'Redis Streams'],
      rejectedBecause: 'Kafka adds operational complexity unnecessary for volume'
    });

    expect(adr1.id).toBe('ADR-001');
    expect(adr1.title).toBe('Use RabbitMQ for Events');

    const adr2 = await decisionManager.recordDecision({
      title: 'Use PostgreSQL for Storage',
      decision: 'Use PostgreSQL as primary relational database.',
      why: 'ACID compliance and JSONB capabilities.',
      alternatives: ['MongoDB']
    });

    expect(adr2.id).toBe('ADR-002');

    const list = await decisionManager.listDecisions();
    expect(list.length).toBe(2);
    expect(list[0].id).toBe('ADR-001');
    expect(list[1].id).toBe('ADR-002');
  });
});
