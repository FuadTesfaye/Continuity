import path from 'node:path';
import { GlobalFileSystem } from './global-file-system.js';
import {
  ProjectCategory,
  ProjectRegistry,
  ProjectRegistryItem,
  ProjectRegistrySchema
} from '../types/global.js';

export class ProjectRegistryManager {
  constructor(private readonly gfs: GlobalFileSystem) {}

  private get registryFile(): string {
    return this.gfs.resolve('projects', 'registry.yml');
  }

  async getRegistry(): Promise<ProjectRegistry> {
    await this.gfs.initGlobalStructure();
    const data = await this.gfs.readYaml<ProjectRegistry>(this.registryFile);
    if (!data) {
      const initial: ProjectRegistry = {
        version: '1.0',
        updatedAt: new Date().toISOString(),
        projects: []
      };
      await this.gfs.writeYaml(this.registryFile, initial);
      return initial;
    }
    return ProjectRegistrySchema.parse(data);
  }

  private async saveRegistry(registry: ProjectRegistry): Promise<void> {
    registry.updatedAt = new Date().toISOString();
    await this.gfs.writeYaml(this.registryFile, registry);
  }

  async listProjects(category?: ProjectCategory): Promise<ProjectRegistryItem[]> {
    const reg = await this.getRegistry();
    if (!category) return reg.projects;
    return reg.projects.filter((p) => p.type === category);
  }

  async getProject(idOrPath: string): Promise<ProjectRegistryItem | undefined> {
    const reg = await this.getRegistry();
    const normalized = path.resolve(idOrPath);
    return reg.projects.find(
      (p) => p.id === idOrPath || path.resolve(p.path) === normalized
    );
  }

  async registerProject(data: {
    path: string;
    name?: string;
    type?: ProjectCategory;
    client?: string;
    repository?: ProjectRegistryItem['repository'];
    stack?: string[];
  }): Promise<ProjectRegistryItem> {
    const reg = await this.getRegistry();
    const resolvedPath = path.resolve(data.path);
    const id = (data.name || path.basename(resolvedPath))
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');

    const existingIndex = reg.projects.findIndex(
      (p) => p.id === id || path.resolve(p.path) === resolvedPath
    );

    const now = new Date().toISOString();
    const item: ProjectRegistryItem = {
      id,
      name: data.name || path.basename(resolvedPath),
      type: data.type || 'personal',
      path: resolvedPath,
      client: data.client,
      repository: data.repository || {
        provider: 'github',
        accountProfile: 'personal'
      },
      stack: data.stack || [],
      continuityEnabled: true,
      lastAccessed: now
    };

    if (existingIndex !== -1) {
      reg.projects[existingIndex] = {
        ...reg.projects[existingIndex],
        ...item,
        lastAccessed: now
      };
    } else {
      reg.projects.push(item);
    }

    await this.saveRegistry(reg);
    return item;
  }

  async classifyProject(
    idOrPath: string,
    type: ProjectCategory,
    clientName?: string
  ): Promise<ProjectRegistryItem> {
    const reg = await this.getRegistry();
    const normalized = path.resolve(idOrPath);
    const item = reg.projects.find(
      (p) => p.id === idOrPath || path.resolve(p.path) === normalized
    );

    if (!item) {
      throw new Error(`Project '${idOrPath}' is not registered. Run 'continuity project register' first.`);
    }

    item.type = type;
    if (clientName) item.client = clientName;
    item.lastAccessed = new Date().toISOString();

    await this.saveRegistry(reg);
    return item;
  }

  async touchProject(idOrPath: string): Promise<void> {
    const reg = await this.getRegistry();
    const normalized = path.resolve(idOrPath);
    const item = reg.projects.find(
      (p) => p.id === idOrPath || path.resolve(p.path) === normalized
    );
    if (item) {
      item.lastAccessed = new Date().toISOString();
      await this.saveRegistry(reg);
    }
  }

  // Security & Client Isolation Boundary
  validateClientIsolation(
    activeProject: ProjectRegistryItem | undefined,
    targetProject: ProjectRegistryItem | undefined
  ): boolean {
    if (!activeProject || !targetProject) return true;
    if (activeProject.id === targetProject.id) return true;

    // If either project is client work, strictly disallow cross-project context bleeding
    if (activeProject.type === 'client' || targetProject.type === 'client') {
      if (activeProject.client && targetProject.client) {
        return activeProject.client.toLowerCase() === targetProject.client.toLowerCase();
      }
      return false;
    }

    return true;
  }
}
