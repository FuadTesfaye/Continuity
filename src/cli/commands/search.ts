import { FileSystem } from '../../core/storage/file-system.js';
import { SQLiteIndexer } from '../../core/search/sqlite-indexer.js';
import { TerminalFormatter } from '../formatters/terminal.js';

export interface SearchOptions {
  type?: string;
  limit?: string;
  reindex?: boolean;
}

export async function runSearch(query: string, options: SearchOptions = {}): Promise<void> {
  const fs = new FileSystem();
  if (!fs.isInitialized()) {
    TerminalFormatter.error("Continuity is not initialized. Run 'continuity init' first.");
    process.exitCode = 1;
    return;
  }

  const indexer = new SQLiteIndexer(fs);
  await indexer.init();

  if (options.reindex) {
    const indexed = await indexer.reindexAll();
    TerminalFormatter.info(`Re-indexed ${indexed} document(s).`);
  } else {
    // Light sync to ensure any new files are indexed
    await indexer.reindexAll();
  }

  const limit = options.limit ? parseInt(options.limit, 10) : 10;
  const results = indexer.search(query, { type: options.type, limit });
  indexer.close();

  TerminalFormatter.header(`Search Results: "${query}" (${results.length} matches)`);

  if (results.length === 0) {
    console.log('No matches found.');
    return;
  }

  for (const r of results) {
    console.log(`\n• [${r.type.toUpperCase()}] ${r.title}`);
    console.log(`  Path: ${r.relativePath}`);
    console.log(`  Snippet: ${r.snippet}`);
  }
}
