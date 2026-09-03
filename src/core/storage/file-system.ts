import fs from 'node:fs/promises';
import path from 'node:path';
import { existsSync } from 'node:fs';

export class FileSystem {
  constructor(public readonly rootDir: string = process.cwd()) {}

  get continuityDir(): string {
    return path.join(this.rootDir, '.continuity');
  }

  resolve(...subpaths: string[]): string {
    return path.join(this.rootDir, ...subpaths);
  }

  resolveContinuity(...subpaths: string[]): string {
    return path.join(this.continuityDir, ...subpaths);
  }

  exists(filePath: string): boolean {
    return existsSync(filePath);
  }

  isInitialized(): boolean {
    return this.exists(this.continuityDir) && this.exists(this.resolveContinuity('state.md'));
  }

  async ensureDir(dirPath: string): Promise<void> {
    await fs.mkdir(dirPath, { recursive: true });
  }

  async readFile(filePath: string): Promise<string> {
    return fs.readFile(filePath, 'utf-8');
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    await this.ensureDir(path.dirname(filePath));
    // Atomic write pattern: write to tmp file in same directory, then rename
    const tmpPath = `${filePath}.${Date.now()}.${Math.random().toString(36).substring(7)}.tmp`;
    await fs.writeFile(tmpPath, content, 'utf-8');
    await fs.rename(tmpPath, filePath);
  }

  async listFiles(dirPath: string, extension?: string): Promise<string[]> {
    if (!this.exists(dirPath)) return [];
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
      if (entry.isFile()) {
        if (!extension || entry.name.endsWith(extension)) {
          files.push(path.join(dirPath, entry.name));
        }
      } else if (entry.isDirectory()) {
        const subFiles = await this.listFiles(path.join(dirPath, entry.name), extension);
        files.push(...subFiles);
      }
    }

    return files;
  }

  async deleteFile(filePath: string): Promise<void> {
    if (this.exists(filePath)) {
      await fs.unlink(filePath);
    }
  }

  async moveFile(srcPath: string, destPath: string): Promise<void> {
    await this.ensureDir(path.dirname(destPath));
    await fs.rename(srcPath, destPath);
  }

  async copyFile(srcPath: string, destPath: string): Promise<void> {
    await this.ensureDir(path.dirname(destPath));
    await fs.copyFile(srcPath, destPath);
  }
}
