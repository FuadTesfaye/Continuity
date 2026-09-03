import path from 'node:path';
import { Failure, FailureSchema } from '../types/failure.js';
import { FileSystem } from '../storage/file-system.js';
import { MarkdownHelper } from '../storage/markdown.js';

export class FailureManager {
  constructor(private readonly fs: FileSystem) {}

  private get failuresDir(): string {
    return this.fs.resolveContinuity('failures');
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 45);
  }

  async recordFailure(data: {
    title: string;
    attempt: string;
    result: string;
    why: string;
    doNotRepeat: string;
    betterApproach: string;
    relatedTask?: string;
    relatedFiles?: string[];
  }): Promise<Failure> {
    await this.fs.ensureDir(this.failuresDir);
    const date = new Date().toISOString().split('T')[0];
    const slug = this.slugify(data.title);
    const id = `${date}-${slug}`;
    const filename = `${id}.md`;
    const filePath = path.join(this.failuresDir, filename);

    const failure: Failure = {
      id,
      title: data.title,
      date,
      attempt: data.attempt,
      result: data.result,
      why: data.why,
      doNotRepeat: data.doNotRepeat,
      betterApproach: data.betterApproach,
      relatedTask: data.relatedTask,
      relatedFiles: data.relatedFiles || []
    };

    const validated = FailureSchema.parse(failure);
    const markdown = this.formatFailureMarkdown(validated);
    await this.fs.writeFile(filePath, markdown);

    return validated;
  }

  async listFailures(): Promise<Failure[]> {
    if (!this.fs.exists(this.failuresDir)) return [];
    const files = await this.fs.listFiles(this.failuresDir, '.md');
    const failures: Failure[] = [];

    for (const file of files) {
      const raw = await this.fs.readFile(file);
      const failure = this.parseFailureMarkdown(raw, path.basename(file, '.md'));
      if (failure) failures.push(failure);
    }

    return failures.sort((a, b) => b.date.localeCompare(a.date));
  }

  private formatFailureMarkdown(f: Failure): string {
    const frontmatter = {
      id: f.id,
      title: f.title,
      date: f.date,
      relatedTask: f.relatedTask,
      relatedFiles: f.relatedFiles
    };

    const body = `# ${f.title}

## Attempt
${f.attempt}

## Result
${f.result}

## Why
${f.why}

## Do Not Repeat
${f.doNotRepeat}

## Better Approach
${f.betterApproach}

## Related Files
${MarkdownHelper.formatBulletList(f.relatedFiles)}
`;

    return MarkdownHelper.stringify(body, frontmatter);
  }

  private parseFailureMarkdown(raw: string, fallbackId: string): Failure | undefined {
    try {
      const parsed = MarkdownHelper.parse<any>(raw);
      const sections = MarkdownHelper.extractSections(parsed.content);

      return {
        id: parsed.data.id || fallbackId,
        title: parsed.data.title || sections.get('Attempt') || fallbackId,
        date: parsed.data.date || new Date().toISOString().split('T')[0],
        attempt: sections.get('Attempt') || '',
        result: sections.get('Result') || 'Failed',
        why: sections.get('Why') || '',
        doNotRepeat: sections.get('Do Not Repeat') || '',
        betterApproach: sections.get('Better Approach') || '',
        relatedTask: parsed.data.relatedTask,
        relatedFiles: parsed.data.relatedFiles || MarkdownHelper.parseBulletList(sections.get('Related Files') || '')
      };
    } catch {
      return undefined;
    }
  }
}
