import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { FileSystem } from '../../src/core/storage/file-system.js';
import { SQLiteIndexer } from '../../src/core/search/sqlite-indexer.js';

describe('SQLiteIndexer', () => {
  let tmpDir: string;
  let fileSystem: FileSystem;
  let indexer: SQLiteIndexer;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'continuity-search-test-'));
    fileSystem = new FileSystem(tmpDir);
    indexer = new SQLiteIndexer(fileSystem);
    await fileSystem.ensureDir(fileSystem.continuityDir);
    await fileSystem.ensureDir(fileSystem.resolveContinuity('decisions'));
    await indexer.init();
  });

  afterEach(async () => {
    indexer.close();
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('indexes and searches documents with ranking', async () => {
    const doc1Path = fileSystem.resolveContinuity('decisions', 'ADR-001-rabbitmq.md');
    await fileSystem.writeFile(
      doc1Path,
      `# ADR-001: RabbitMQ Message Broker

## Decision
We chose RabbitMQ for inter-service communication.

## Why
Procurement events must be processed asynchronously and multiple services consume them.

## Alternatives
Kafka was considered unnecessary for the expected event volume.
`
    );

    const doc2Path = fileSystem.resolveContinuity('decisions', 'ADR-002-drizzle.md');
    await fileSystem.writeFile(
      doc2Path,
      `# ADR-002: Drizzle ORM

## Decision
We selected Drizzle instead of Prisma for lightweight SQL queries.
`
    );

    const indexedCount = await indexer.reindexAll();
    expect(indexedCount).toBe(2);

    const results = indexer.search('RabbitMQ');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].title).toContain('RabbitMQ');
    expect(results[0].type).toBe('decision');

    const drizzleResults = indexer.search('Drizzle');
    expect(drizzleResults.length).toBeGreaterThan(0);
    expect(drizzleResults[0].title).toContain('Drizzle');
  });
});
