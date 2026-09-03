import path from 'node:path';
import { FileSystem } from '../../core/storage/file-system.js';
import { GitClient } from '../../core/git/git-client.js';
import { SQLiteIndexer } from '../../core/search/sqlite-indexer.js';
import { TerminalFormatter } from '../formatters/terminal.js';
import {
  DEFAULT_CONTINUITY_MD,
  DEFAULT_PROJECT_MD,
  DEFAULT_STATE_MD,
  DEFAULT_ARCHITECTURE_MD,
  DEFAULT_ROADMAP_MD,
  DEFAULT_INDEX_MD,
  DEFAULT_CONFIG_YML
} from '../../templates/defaults.js';
import {
  UNIVERSAL_SKILL_MD,
  CURSOR_RULES_MDC,
  CLAUDE_CODE_SNIPPET,
  WINDSURF_RULES_SNIPPET,
  CLINE_RULES_SNIPPET
} from '../../templates/universal-skill.js';

export interface InitOptions {
  name?: string;
  description?: string;
  stack?: string[];
  force?: boolean;
  withAgents?: boolean;
}

export async function runInit(options: InitOptions = {}): Promise<void> {
  const fs = new FileSystem();
  const git = new GitClient();

  if (fs.isInitialized() && !options.force) {
    TerminalFormatter.warning('Continuity is already initialized in this repository.');
    console.log('Use --force to re-initialize files.');
    return;
  }

  // Detect project name from package.json or folder name
  let projectName = options.name;
  if (!projectName) {
    const pkgPath = fs.resolve('package.json');
    if (fs.exists(pkgPath)) {
      try {
        const pkg = JSON.parse(await fs.readFile(pkgPath));
        projectName = pkg.name;
      } catch {}
    }
  }
  if (!projectName) {
    projectName = path.basename(process.cwd());
  }

  const branch = (await git.isGitRepository()) ? await git.getCurrentBranch() : 'main';

  TerminalFormatter.header(`Initializing Continuity for "${projectName}"`);

  // Ensure directories exist
  const dirs = [
    fs.resolveContinuity('tasks', 'active'),
    fs.resolveContinuity('tasks', 'completed'),
    fs.resolveContinuity('tasks', 'blocked'),
    fs.resolveContinuity('sessions', 'summaries'),
    fs.resolveContinuity('sessions', 'raw'),
    fs.resolveContinuity('handovers'),
    fs.resolveContinuity('decisions'),
    fs.resolveContinuity('failures'),
    fs.resolveContinuity('snapshots'),
    fs.resolveContinuity('cache'),
    fs.resolve('skills', 'continuity')
  ];

  for (const dir of dirs) {
    await fs.ensureDir(dir);
  }

  // Create core files
  await fs.writeFile(fs.resolve('CONTINUITY.md'), DEFAULT_CONTINUITY_MD);
  TerminalFormatter.success('Created CONTINUITY.md (root protocol file)');

  await fs.writeFile(fs.resolveContinuity('project.md'), DEFAULT_PROJECT_MD(projectName, options.description, options.stack));
  TerminalFormatter.success('Created .continuity/project.md');

  await fs.writeFile(fs.resolveContinuity('state.md'), DEFAULT_STATE_MD(projectName, branch));
  TerminalFormatter.success('Created .continuity/state.md');

  await fs.writeFile(fs.resolveContinuity('architecture.md'), DEFAULT_ARCHITECTURE_MD(projectName));
  TerminalFormatter.success('Created .continuity/architecture.md');

  await fs.writeFile(fs.resolveContinuity('roadmap.md'), DEFAULT_ROADMAP_MD);
  TerminalFormatter.success('Created .continuity/roadmap.md');

  await fs.writeFile(fs.resolveContinuity('index.md'), DEFAULT_INDEX_MD);
  TerminalFormatter.success('Created .continuity/index.md');

  await fs.writeFile(fs.resolveContinuity('config.yml'), DEFAULT_CONFIG_YML);
  TerminalFormatter.success('Created .continuity/config.yml');

  // Create universal AI skill
  await fs.writeFile(fs.resolve('skills', 'continuity', 'SKILL.md'), UNIVERSAL_SKILL_MD);
  TerminalFormatter.success('Created skills/continuity/SKILL.md');

  // Create agent compatibility rules if requested or by default
  if (options.withAgents) {
    await fs.ensureDir(fs.resolve('.cursor', 'rules'));
    await fs.writeFile(fs.resolve('.cursor', 'rules', 'continuity.mdc'), CURSOR_RULES_MDC);
    await fs.writeFile(fs.resolve('CLAUDE.md'), CLAUDE_CODE_SNIPPET);
    await fs.writeFile(fs.resolve('.windsurfrules'), WINDSURF_RULES_SNIPPET);
    await fs.writeFile(fs.resolve('.clinerules'), CLINE_RULES_SNIPPET);
    TerminalFormatter.success('Created AI agent adapters (Cursor, Claude Code, Windsurf, Cline)');
  }

  // Ensure .gitignore ignores cache and raw sessions
  const gitignorePath = fs.resolve('.gitignore');
  let gitignoreContent = fs.exists(gitignorePath) ? await fs.readFile(gitignorePath) : '';
  const ignoresToAdd: string[] = [];

  if (!gitignoreContent.includes('.continuity/cache')) {
    ignoresToAdd.push('.continuity/cache/');
  }
  if (!gitignoreContent.includes('.continuity/sessions/raw')) {
    ignoresToAdd.push('.continuity/sessions/raw/');
  }

  if (ignoresToAdd.length > 0) {
    const updatedGitignore = (gitignoreContent ? gitignoreContent.trim() + '\n\n' : '') +
      '# Continuity local cache and raw transcripts\n' +
      ignoresToAdd.join('\n') + '\n';
    await fs.writeFile(gitignorePath, updatedGitignore);
    TerminalFormatter.success('Updated .gitignore with .continuity/cache/ and .continuity/sessions/raw/');
  }

  // Build initial SQLite index
  const indexer = new SQLiteIndexer(fs);
  await indexer.init();
  const indexed = await indexer.reindexAll();
  indexer.close();
  TerminalFormatter.success(`Indexed ${indexed} initial documents into SQLite cache`);

  TerminalFormatter.box('Continuity Initialized Successfully', [
    'Your repository is now equipped with Continuity.',
    'Any AI agent can now resume work with:',
    '  continuity resume',
    '',
    'Next steps:',
    '1. Review .continuity/project.md and architecture.md',
    '2. Start your first task: continuity task start "<task-title>"'
  ]);
}
