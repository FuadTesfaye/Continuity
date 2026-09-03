import path from 'node:path';
import { GlobalFileSystem } from './global-file-system.js';

export interface KnowledgeArticle {
  category: string;
  name: string;
  path: string;
  content: string;
  title: string;
}

export class KnowledgeManager {
  constructor(private readonly gfs: GlobalFileSystem) {}

  private get knowledgeDir(): string {
    return this.gfs.resolve('knowledge');
  }

  private get historyDir(): string {
    return this.gfs.resolve('history');
  }

  async listArticles(category?: string): Promise<KnowledgeArticle[]> {
    await this.gfs.initGlobalStructure();
    const articles: KnowledgeArticle[] = [];
    const targetDir = category ? path.join(this.knowledgeDir, category) : this.knowledgeDir;

    const files = await this.gfs.listFiles(targetDir, '.md');
    for (const file of files) {
      const content = await this.gfs.readFile(file);
      const relative = path.relative(this.knowledgeDir, file);
      const parts = relative.split(path.sep);
      const cat = parts.length > 1 ? parts[0] : 'general';
      const name = path.basename(file, '.md');

      const titleMatch = content.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1].trim() : name;

      articles.push({
        category: cat,
        name,
        path: file,
        content,
        title
      });
    }

    return articles;
  }

  async saveArticle(category: string, name: string, content: string): Promise<string> {
    await this.gfs.initGlobalStructure();
    const safeName = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const safeCat = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const targetPath = path.join(this.knowledgeDir, safeCat, `${safeName}.md`);
    await this.gfs.writeFile(targetPath, content);
    return targetPath;
  }

  async getArticle(category: string, name: string): Promise<KnowledgeArticle | undefined> {
    const safeName = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const targetPath = path.join(this.knowledgeDir, category, `${safeName}.md`);
    if (!this.gfs.exists(targetPath)) return undefined;

    const content = await this.gfs.readFile(targetPath);
    const titleMatch = content.match(/^#\s+(.+)$/m);
    return {
      category,
      name: safeName,
      path: targetPath,
      content,
      title: titleMatch ? titleMatch[1].trim() : safeName
    };
  }
}
