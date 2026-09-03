import { FileSystem } from '../../core/storage/file-system.js';
import { SQLiteIndexer } from '../../core/search/sqlite-indexer.js';
import { TerminalFormatter } from '../formatters/terminal.js';

export async function runContext(query: string, options: { limit?: number; type?: string } = {}): Promise<void> {
  const fs = new FileSystem();
  if (!fs.isInitialized()) {
    TerminalFormatter.error("Continuity is not initialized. Run 'continuity init' first.");
    process.exitCode = 1;
    return;
  }

  const indexer = new SQLiteIndexer(fs);
  await indexer.init();
  await indexer.reindexAll();

  const results = indexer.search(query, { limit: options.limit || 5, type: options.type });
  indexer.close();

  TerminalFormatter.header(`Historical Context: "${query}"`);

  if (results.length === 0) {
    console.log('No historical matches found.');
    return;
  }

  for (const r of results) {
    console.log(`\n• [${r.type.toUpperCase()}] ${r.title}`);
    console.log(`  File: ${r.relativePath}`);
    console.log(`  ${r.snippet}`);
  }
}
