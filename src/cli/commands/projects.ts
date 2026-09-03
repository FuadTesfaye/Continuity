import path from 'node:path';
import { GlobalFileSystem } from '../../core/global/global-file-system.js';
import { ProjectRegistryManager } from '../../core/global/project-registry.js';
import { ProjectCategory } from '../../core/types/global.js';
import { TerminalFormatter } from '../formatters/terminal.js';

export interface ProjectsOptions {
  category?: string;
  json?: boolean;
}

export async function runProjects(options: ProjectsOptions = {}): Promise<void> {
  const gfs = new GlobalFileSystem();
  await gfs.initGlobalStructure();

  const manager = new ProjectRegistryManager(gfs);
  const projects = await manager.listProjects(options.category as ProjectCategory);

  if (options.json) {
    console.log(JSON.stringify(projects, null, 2));
    return;
  }

  TerminalFormatter.header('Project Registry (~/.continuity/projects)');

  if (projects.length === 0) {
    console.log('\nNo projects registered yet.');
    console.log('Run "continuity project register" inside a project directory.');
    return;
  }

  const categories: ProjectCategory[] = [
    'personal',
    'client',
    'work',
    'open-source',
    'learning',
    'experimental',
    'archived'
  ];

  for (const cat of categories) {
    const matching = projects.filter((p) => p.type === cat);
    if (matching.length === 0) continue;

    TerminalFormatter.section(`${cat.toUpperCase()} (${matching.length})`);
    for (const p of matching) {
      console.log(`  • ${p.name} (id: ${p.id})`);
      console.log(`    Path: ${p.path}`);
      if (p.client) console.log(`    Client: ${p.client}`);
      if (p.stack.length > 0) console.log(`    Stack: ${p.stack.join(', ')}`);
    }
  }
}

export async function runProjectRegister(projectPath = '.'): Promise<void> {
  const gfs = new GlobalFileSystem();
  await gfs.initGlobalStructure();

  const manager = new ProjectRegistryManager(gfs);
  const resolved = path.resolve(projectPath);

  const registered = await manager.registerProject({
    path: resolved,
    type: 'personal'
  });

  TerminalFormatter.success(`Project registered in global registry: "${registered.name}"`);
  TerminalFormatter.item('Category', registered.type.toUpperCase());
  TerminalFormatter.item('Path', registered.path);
}

export async function runProjectClassify(type: string, clientName?: string): Promise<void> {
  const gfs = new GlobalFileSystem();
  await gfs.initGlobalStructure();

  const manager = new ProjectRegistryManager(gfs);
  const cwd = process.cwd();

  const updated = await manager.classifyProject(cwd, type as ProjectCategory, clientName);

  TerminalFormatter.success(`Project classified as "${updated.type.toUpperCase()}"`);
  if (updated.client) {
    TerminalFormatter.item('Client Name', updated.client);
  }
}
