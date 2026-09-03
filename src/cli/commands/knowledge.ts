import { GlobalFileSystem } from '../../core/global/global-file-system.js';
import { KnowledgeManager } from '../../core/global/knowledge-manager.js';
import { TerminalFormatter } from '../formatters/terminal.js';

export interface KnowledgeOptions {
  json?: boolean;
}

export async function runKnowledge(category?: string, options: KnowledgeOptions = {}): Promise<void> {
  const gfs = new GlobalFileSystem();
  await gfs.initGlobalStructure();

  const manager = new KnowledgeManager(gfs);
  const articles = await manager.listArticles(category);

  if (options.json) {
    console.log(JSON.stringify(articles, null, 2));
    return;
  }

  TerminalFormatter.header(`Global Knowledge Base (~/.continuity/knowledge)`);

  if (articles.length === 0) {
    console.log(`\nNo knowledge articles found${category ? ` in category '${category}'` : ''}.`);
    console.log('Categories: ai, architecture, frontend, backend, devops');
    console.log(`Articles are saved as Markdown in: ${gfs.resolve('knowledge')}`);
    return;
  }

  const byCategory: Record<string, typeof articles> = {};
  for (const art of articles) {
    if (!byCategory[art.category]) byCategory[art.category] = [];
    byCategory[art.category].push(art);
  }

  for (const [cat, list] of Object.entries(byCategory)) {
    TerminalFormatter.section(cat.toUpperCase());
    for (const art of list) {
      console.log(`  • ${art.title} (${art.name}.md)`);
    }
  }
}
