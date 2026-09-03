import matter from 'gray-matter';

export interface ParsedMarkdown<T = Record<string, any>> {
  data: T;
  content: string;
}

export class MarkdownHelper {
  static parse<T = Record<string, any>>(rawContent: string): ParsedMarkdown<T> {
    const parsed = matter(rawContent);
    return {
      data: parsed.data as T,
      content: parsed.content.trim()
    };
  }

  static stringify<T = Record<string, any>>(content: string, data?: T): string {
    if (!data || Object.keys(data).length === 0) {
      return content.trim() + '\n';
    }
    // Remove undefined values to avoid js-yaml dumping errors
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        cleaned[key] = value;
      }
    }
    if (Object.keys(cleaned).length === 0) {
      return content.trim() + '\n';
    }
    return matter.stringify(content.trim() + '\n', cleaned);
  }

  /**
   * Extracts top-level or H2 sections from markdown text
   */
  static extractSections(markdown: string): Map<string, string> {
    const sections = new Map<string, string>();
    const lines = markdown.split('\n');
    let currentHeader = '';
    let currentContent: string[] = [];

    for (const line of lines) {
      const headerMatch = line.match(/^#{1,3}\s+(.+)$/);
      if (headerMatch) {
        if (currentHeader) {
          sections.set(currentHeader.trim(), currentContent.join('\n').trim());
        }
        currentHeader = headerMatch[1].trim();
        currentContent = [];
      } else {
        currentContent.push(line);
      }
    }

    if (currentHeader) {
      sections.set(currentHeader.trim(), currentContent.join('\n').trim());
    }

    return sections;
  }

  /**
   * Parses Markdown bullet list into string array
   */
  static parseBulletList(text: string): string[] {
    if (!text) return [];
    return text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('-') || line.startsWith('*') || line.startsWith('✓') || line.startsWith('□'))
      .map((line) => line.replace(/^[-*✓□]\s*/, '').trim())
      .filter(Boolean);
  }

  /**
   * Formats string array into Markdown bullet list
   */
  static formatBulletList(items: string[], bullet = '-'): string {
    if (!items || items.length === 0) return 'None';
    return items.map((item) => `${bullet} ${item}`).join('\n');
  }

  /**
   * Formats checked bullet list (✓ / □)
   */
  static formatChecklist(items: Array<{ title: string; completed: boolean }>): string {
    if (!items || items.length === 0) return 'None';
    return items.map((item) => `${item.completed ? '✓' : '□'} ${item.title}`).join('\n');
  }
}
