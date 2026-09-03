import { GitClient } from '../../core/git/git-client.js';
import { TerminalFormatter } from '../formatters/terminal.js';

export async function runGitCommand(): Promise<void> {
  const git = new GitClient();
  const isRepo = await git.isGitRepository();

  if (!isRepo) {
    TerminalFormatter.error('Not a Git repository. Run "git init" to enable version tracking.');
    process.exitCode = 1;
    return;
  }

  const status = await git.getStatus();
  const recentCommits = await git.getRecentCommits(5);

  TerminalFormatter.header('Git Context Overview');

  TerminalFormatter.section('CURRENT REPOSITORY STATE');
  TerminalFormatter.item('Branch', status.branch);
  TerminalFormatter.item('HEAD Commit', status.commit ? `${status.commit.shortHash} - ${status.commit.message}` : 'None');
  TerminalFormatter.item('Working Tree', status.hasUncommittedChanges ? 'Uncommitted changes present' : 'Clean');

  if (status.stats) {
    TerminalFormatter.item(
      'Diff Stats',
      `${status.stats.filesChanged} files (+${status.stats.insertions} / -${status.stats.deletions})`
    );
  }

  if (status.modifiedFiles.length > 0) {
    TerminalFormatter.section('MODIFIED FILES');
    for (const f of status.modifiedFiles) {
      console.log(`  M ${f}`);
    }
  }

  if (status.stagedFiles.length > 0) {
    TerminalFormatter.section('STAGED FILES');
    for (const f of status.stagedFiles) {
      console.log(`  A ${f}`);
    }
  }

  TerminalFormatter.section('RECENT COMMITS (LEVEL 2)');
  if (recentCommits.length > 0) {
    for (const c of recentCommits) {
      console.log(`• \`${c.shortHash}\` ${c.message} (${c.author}, ${c.date})`);
    }
  } else {
    console.log('No commits recorded yet.');
  }
}
