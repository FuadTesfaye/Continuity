import path from 'node:path';
import { FileSystem } from '../storage/file-system.js';
import { EntityRelationship, EntityType } from '../types/graph.js';

export interface SearchResult {
  path: string;
  relativePath: string;
  type: string;
  title: string;
  snippet: string;
  score: number;
}

export interface IndexedDocument {
  path: string;
  relativePath: string;
  type: string;
  title: string;
  content: string;
  modifiedAt: number;
}

export class SQLiteIndexer {
  private db: any = null;
  private isNodeSqliteAvailable = false;
  private inMemoryFallbackDocs: Map<string, IndexedDocument> = new Map();
  private inMemoryFallbackRels: EntityRelationship[] = [];

  constructor(private readonly fs: FileSystem) {}

  async init(): Promise<void> {
    const cacheDir = this.fs.resolveContinuity('cache');
    await this.fs.ensureDir(cacheDir);
    const dbPath = path.join(cacheDir, 'index.db');

    try {
      const sqliteModule = await import('node:sqlite');
      if (sqliteModule && sqliteModule.DatabaseSync) {
        this.db = new sqliteModule.DatabaseSync(dbPath);
        this.isNodeSqliteAvailable = true;
        this.setupTables();
        return;
      }
    } catch {}

    this.isNodeSqliteAvailable = false;
  }

  private setupTables(): void {
    if (!this.db) return;

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS documents (
        path TEXT PRIMARY KEY,
        relative_path TEXT,
        type TEXT,
        title TEXT,
        content TEXT,
        modified_at INTEGER
      );

      CREATE TABLE IF NOT EXISTS relationships (
        source_id TEXT,
        source_type TEXT,
        target_id TEXT,
        target_type TEXT,
        relation TEXT,
        created_at TEXT,
        PRIMARY KEY (source_id, source_type, target_id, target_type, relation)
      );
    `);

    try {
      this.db.exec(`
        CREATE VIRTUAL TABLE IF NOT EXISTS documents_fts USING fts5(
          path UNINDEXED,
          relative_path UNINDEXED,
          type,
          title,
          content,
          tokenize='porter unicode61'
        );
      `);
    } catch {
      this.isNodeSqliteAvailable = false;
    }
  }

  determineType(relativePath: string): string {
    if (relativePath.includes('plans/')) return 'plan';
    if (relativePath.includes('decisions/')) return 'decision';
    if (relativePath.includes('tasks/')) return 'task';
    if (relativePath.includes('sessions/')) return 'session';
    if (relativePath.includes('failures/')) return 'failure';
    if (relativePath.includes('handovers/')) return 'handover';
    if (relativePath.endsWith('state.md')) return 'state';
    if (relativePath.endsWith('project.md')) return 'project';
    if (relativePath.endsWith('architecture.md')) return 'architecture';
    if (relativePath.endsWith('roadmap.md')) return 'roadmap';
    return 'document';
  }

  extractTitle(content: string, fallback: string): string {
    const match = content.match(/^#+\s+(.+)$/m);
    if (match && match[1]) {
      return match[1].trim();
    }
    return fallback;
  }

  async indexFile(filePath: string): Promise<void> {
    if (!this.fs.exists(filePath)) return;
    const content = await this.fs.readFile(filePath);
    const relativePath = path.relative(this.fs.rootDir, filePath);
    const type = this.determineType(relativePath);
    const filename = path.basename(filePath, '.md');
    const title = this.extractTitle(content, filename);
    const doc: IndexedDocument = {
      path: filePath,
      relativePath,
      type,
      title,
      content,
      modifiedAt: Date.now()
    };

    if (this.isNodeSqliteAvailable && this.db) {
      try {
        const stmt = this.db.prepare(`
          INSERT INTO documents (path, relative_path, type, title, content, modified_at)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(path) DO UPDATE SET
            relative_path=excluded.relative_path,
            type=excluded.type,
            title=excluded.title,
            content=excluded.content,
            modified_at=excluded.modified_at;
        `);
        stmt.run(doc.path, doc.relativePath, doc.type, doc.title, doc.content, doc.modifiedAt);

        // Update FTS
        const delFts = this.db.prepare(`DELETE FROM documents_fts WHERE path = ?;`);
        delFts.run(doc.path);
        const insFts = this.db.prepare(`
          INSERT INTO documents_fts (path, relative_path, type, title, content)
          VALUES (?, ?, ?, ?, ?);
        `);
        insFts.run(doc.path, doc.relativePath, doc.type, doc.title, doc.content);
        return;
      } catch {}
    }

    this.inMemoryFallbackDocs.set(filePath, doc);
  }

  recordRelationship(rel: EntityRelationship): void {
    if (this.isNodeSqliteAvailable && this.db) {
      try {
        const stmt = this.db.prepare(`
          INSERT OR REPLACE INTO relationships (source_id, source_type, target_id, target_type, relation, created_at)
          VALUES (?, ?, ?, ?, ?, ?);
        `);
        stmt.run(
          rel.sourceId,
          rel.sourceType,
          rel.targetId,
          rel.targetType,
          rel.relation,
          rel.createdAt || new Date().toISOString()
        );
        return;
      } catch {}
    }

    // Fallback
    this.inMemoryFallbackRels.push(rel);
  }

  getRelatedEntities(
    entityId: string,
    entityType: EntityType
  ): Array<{ id: string; type: EntityType; relation: string }> {
    if (this.isNodeSqliteAvailable && this.db) {
      try {
        const stmt = this.db.prepare(`
          SELECT target_id as id, target_type as type, relation FROM relationships
          WHERE source_id = ? AND source_type = ?
          UNION
          SELECT source_id as id, source_type as type, relation FROM relationships
          WHERE target_id = ? AND target_type = ?;
        `);
        return stmt.all(entityId, entityType, entityId, entityType);
      } catch {}
    }

    const matches: Array<{ id: string; type: EntityType; relation: string }> = [];
    for (const r of this.inMemoryFallbackRels) {
      if (r.sourceId === entityId && r.sourceType === entityType) {
        matches.push({ id: r.targetId, type: r.targetType, relation: r.relation });
      } else if (r.targetId === entityId && r.targetType === entityType) {
        matches.push({ id: r.sourceId, type: r.sourceType, relation: r.relation });
      }
    }
    return matches;
  }

  async reindexAll(): Promise<number> {
    const files = await this.fs.listFiles(this.fs.continuityDir, '.md');
    const continuityRootMd = this.fs.resolve('CONTINUITY.md');
    if (this.fs.exists(continuityRootMd)) {
      files.push(continuityRootMd);
    }

    let indexedCount = 0;
    for (const file of files) {
      if (file.includes('/cache/') || file.includes('\\cache\\')) continue;
      await this.indexFile(file);
      indexedCount++;
    }

    return indexedCount;
  }

  search(query: string, options: { type?: string; limit?: number } = {}): SearchResult[] {
    const limit = options.limit || 10;
    const sanitizedQuery = query.trim().replace(/['"*]/g, '');

    if (this.isNodeSqliteAvailable && this.db && sanitizedQuery) {
      try {
        let sql = `
          SELECT path, relative_path, type, title, snippet(documents_fts, 4, '>>>', '<<<', '...', 32) as snippet, bm25(documents_fts) as score
          FROM documents_fts
          WHERE documents_fts MATCH ?
        `;
        const params: any[] = [`"${sanitizedQuery}"*`];

        if (options.type) {
          sql += ` AND type = ?`;
          params.push(options.type);
        }

        sql += ` ORDER BY score ASC LIMIT ?;`;
        params.push(limit);

        const rows = this.db.prepare(sql).all(...params);
        return rows.map((row: any) => ({
          path: row.path,
          relativePath: row.relative_path,
          type: row.type,
          title: row.title,
          snippet: row.snippet || row.title,
          score: Math.abs(row.score)
        }));
      } catch {}
    }

    return this.fallbackSearch(sanitizedQuery, options.type, limit);
  }

  private fallbackSearch(query: string, filterType?: string, limit = 10): SearchResult[] {
    const results: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();
    const terms = lowerQuery.split(/\s+/).filter(Boolean);

    for (const doc of this.inMemoryFallbackDocs.values()) {
      if (filterType && doc.type !== filterType) continue;

      const lowerContent = doc.content.toLowerCase();
      const lowerTitle = doc.title.toLowerCase();

      let matchCount = 0;
      for (const term of terms) {
        if (lowerTitle.includes(term)) matchCount += 3;
        if (lowerContent.includes(term)) matchCount += 1;
      }

      if (matchCount > 0) {
        let snippet = doc.title;
        const firstIndex = lowerContent.indexOf(terms[0]);
        if (firstIndex !== -1) {
          const start = Math.max(0, firstIndex - 50);
          const end = Math.min(doc.content.length, firstIndex + 150);
          snippet = '...' + doc.content.slice(start, end).replace(/\n+/g, ' ') + '...';
        }

        results.push({
          path: doc.path,
          relativePath: doc.relativePath,
          type: doc.type,
          title: doc.title,
          snippet,
          score: matchCount
        });
      }
    }

    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  close(): void {
    if (this.db) {
      try {
        this.db.close();
      } catch {}
      this.db = null;
    }
  }
}
