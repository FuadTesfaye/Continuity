import pc from 'picocolors';

export class TerminalFormatter {
  static header(title: string): void {
    console.log('\n' + pc.bold(pc.cyan(`=== ${title.toUpperCase()} ===`)));
  }

  static section(title: string): void {
    console.log('\n' + pc.bold(pc.yellow(title)));
    console.log(pc.gray('-'.repeat(Math.max(title.length, 30))));
  }

  static item(label: string, value: string | number | undefined): void {
    console.log(`${pc.bold(label.padEnd(16))}: ${value !== undefined ? value : pc.gray('None')}`);
  }

  static success(message: string): void {
    console.log(pc.green(`✓ ${message}`));
  }

  static warning(message: string): void {
    console.log(pc.yellow(`! ${message}`));
  }

  static error(message: string): void {
    console.log(pc.red(`✗ ${message}`));
  }

  static info(message: string): void {
    console.log(pc.blue(`ℹ ${message}`));
  }

  static checklist(completed: string[], remaining: string[]): void {
    if (completed.length > 0) {
      console.log(pc.bold(pc.green('\nCOMPLETED')));
      for (const item of completed) {
        console.log(pc.green(`  ✓ ${item}`));
      }
    }

    if (remaining.length > 0) {
      console.log(pc.bold(pc.cyan('\nREMAINING')));
      for (const item of remaining) {
        console.log(pc.cyan(`  □ ${item}`));
      }
    }
  }

  static box(title: string, lines: string[]): void {
    const width = Math.max(...lines.map((l) => l.length), title.length + 4, 45);
    const top = `┌─ ${title} ${'─'.repeat(Math.max(0, width - title.length - 4))}┐`;
    const bottom = `└${'─'.repeat(width)}┘`;

    console.log('\n' + pc.cyan(top));
    for (const line of lines) {
      console.log(pc.cyan('│ ') + line.padEnd(width - 2) + pc.cyan(' │'));
    }
    console.log(pc.cyan(bottom) + '\n');
  }
}
