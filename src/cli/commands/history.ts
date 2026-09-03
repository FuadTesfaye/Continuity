import { GitClient } from '../../core/git/git-client.js';
import { TerminalFormatter } from '../formatters/terminal.js';

export interface HistoryOptions {
  symbol?: string;
  limit?: string;
}

export async function runHistoryCommand(targetPath: string, options: HistoryOptions = {}): Promise<void> {
  const git = new GitClient();
  const isRepo = await git.isGitRepository();

  if (!isRepo) {
    TerminalFormatter.error('Not a Git repository.');
    process.exitCode = 1;
    return;
  }

  const limit = options.limit ? parseInt(options.limit, 10) : 15;

  if (options.symbol) {
    TerminalFormatter.header(`Archaeology: Symbol "${options.symbol}" in ${targetPath}`);
    const symbolCommits = await git.searchSymbolHistory(options.symbol, targetPath, limit);

    if (symbolCommits.length === 0) {
      console.log(`No commits found introducing or modifying symbol "${options.symbol}".`);
      return;
    }

    for (const c of symbolCommits) {
      console.log(`• \`${c.shortHash}\` (${c.date}) ${c.message} [${c.author}]`);
    }
    return;
  }

  TerminalFormatter.header(`Temporal Evolution: ${targetPath}`);
  const evolution = await git.getModuleEvolution(targetPath);

  TerminalFormatter.item('Total Commits Touching Module', evolution.totalCommits);

  if (evolution.releases.length > 0) {
    TerminalFormatter.section('VERSION BOUNDARIES & RELEASES');
    for (const rel of evolution.releases) {
      console.log(`\nTag: ${rel.tag} (${rel.date})`);
      for (const c of rel.commits) {
        console.log(`  • \`${c.shortHash}\` ${c.message}`);
      }
    }
  }

  TerminalFormatter.section('RECENT COMMITS');
  if (evolution.recentCommits.length > 0) {
    for (const c of evolution.recentCommits) {
      console.log(`• \`${c.shortHash}\` (${c.date}) ${c.message} [${c.author}]`);
    }
  } else {
    console.log('No recent commits touching this target.');
  }
}
