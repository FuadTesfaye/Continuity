import { GitClient } from '../../core/git/git-client.js';
import { TerminalFormatter } from '../formatters/terminal.js';

export async function runDiffCommand(files?: string[]): Promise<void> {
  const git = new GitClient();
  const isRepo = await git.isGitRepository();

  if (!isRepo) {
    TerminalFormatter.error('Not a Git repository.');
    process.exitCode = 1;
    return;
  }

  const contextDiff = await git.getContextDiff(files);
  if (!contextDiff.trim()) {
    console.log('No uncommitted changes.');
    return;
  }

  console.log(contextDiff);
}
