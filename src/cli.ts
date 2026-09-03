#!/usr/bin/env node

import { Command } from 'commander';
import { runInit } from './cli/commands/init.js';
import { runStatus } from './cli/commands/status.js';
import { runResume } from './cli/commands/resume.js';
import { runHandover } from './cli/commands/handover.js';
import { runSessionSave, runSessionList } from './cli/commands/session.js';
import { runContext } from './cli/commands/context.js';
import {
  runTaskStart,
  runTaskUpdate,
  runTaskComplete,
  runTaskBlock,
  runTaskList
} from './cli/commands/task.js';
import { runDecision, runLog } from './cli/commands/decision.js';
import { runFailure } from './cli/commands/failure.js';
import { runCheckpoint, runRestoreContext } from './cli/commands/checkpoint.js';
import { runExplain } from './cli/commands/explain.js';
import { runSearch } from './cli/commands/search.js';
import { runDoctor } from './cli/commands/doctor.js';
import { runExport } from './cli/commands/export.js';
import { runDone } from './cli/commands/done.js';

const program = new Command();

program
  .name('continuity')
  .description('Persistent project-context and work-state system for multi-agent and human AI collaboration')
  .version('0.1.0');

// init
program
  .command('init')
  .description('Initialize Continuity in the current repository')
  .option('-n, --name <name>', 'Project name')
  .option('-d, --description <desc>', 'Project purpose and description')
  .option('-s, --stack <items...>', 'Key technologies / stack items')
  .option('-f, --force', 'Overwrite existing files')
  .option('--with-agents', 'Scaffold configuration files for Cursor, Claude Code, Windsurf, Cline')
  .action(runInit);

// status
program
  .command('status')
  .description('Display current project work-state, active task, progress, and next action')
  .option('--json', 'Output machine-readable JSON')
  .action(runStatus);

// resume
program
  .command('resume')
  .description('Assemble and load compact prioritized context for continuation by any AI agent')
  .option('-c, --compact', 'Output token-efficient compact prompt format (default)')
  .option('--full', 'Output full multi-section markdown documentation')
  .option('--json', 'Output structured JSON payload')
  .action(runResume);

// handover
program
  .command('handover')
  .description('Package current work state into an actionable continuation package')
  .option('-t, --task <name>', 'Current task name')
  .option('-p, --progress <number>', 'Progress percentage (0-100)')
  .option('-c, --completed <items>', 'Comma-separated completed items')
  .option('-r, --remaining <items>', 'Comma-separated remaining items')
  .option('--problem <problem>', 'Current blocker or problem to solve')
  .option('--solution <solution>', 'Expected solution approach')
  .option('--file <file>', 'Specific file to open for next action')
  .option('--focus <focus>', 'Specific function or block to focus on')
  .option('--constraints <items>', 'Comma-separated architectural constraints')
  .option('--author <author>', 'Author or agent identifier')
  .action(runHandover);

// session
const sessionCmd = program.command('session').description('Manage and record developer and AI sessions');
sessionCmd
  .command('save')
  .description('Record a session summary and optional raw archive')
  .option('-a, --agent <agent>', 'Agent identifier (claude, cursor, gpt, human, etc.)')
  .option('-o, --objective <objective>', 'Session objective')
  .option('-c, --completed <items>', 'Comma-separated completed work')
  .option('-f, --files <items>', 'Comma-separated modified files')
  .option('-d, --decisions <items>', 'Comma-separated decisions made')
  .option('--failed <items>', 'Comma-separated failed approaches')
  .option('-p, --problems <items>', 'Comma-separated problems or blockers')
  .option('-n, --next <nextStep>', 'Next step')
  .option('--context <context>', 'Important context or constraints')
  .option('--raw-file <path>', 'Path to file containing raw session transcript')
  .action(runSessionSave);

sessionCmd
  .command('list')
  .description('List all recorded historical sessions')
  .action(runSessionList);

// context
program
  .command('context <query>')
  .description('Search historical sessions, decisions, architecture, and failures to answer questions')
  .option('-l, --limit <number>', 'Maximum number of results to display', '5')
  .option('-t, --type <type>', 'Filter by document type (decision, session, task, etc.)')
  .action((query, opts) => runContext(query, { limit: parseInt(opts.limit, 10), type: opts.type }));

// task
const taskCmd = program.command('task').description('Manage active, completed, and blocked tasks');
taskCmd
  .command('start <title>')
  .description('Start a new active task')
  .option('-d, --description <desc>', 'Task description')
  .option('-r, --remaining <items>', 'Comma-separated remaining checklist items')
  .option('-f, --files <items>', 'Comma-separated related files')
  .action(runTaskStart);

taskCmd
  .command('update [id]')
  .description('Update progress, completed items, or blockers for a task')
  .option('-p, --progress <number>', 'New progress percentage (0-100)')
  .option('-c, --completed <items>', 'Comma-separated completed items to add')
  .option('-r, --remaining <items>', 'Comma-separated remaining items to add')
  .option('-b, --blocker <reason>', 'Set current blocker')
  .option('-f, --files <items>', 'Comma-separated related files to add')
  .action(runTaskUpdate);

taskCmd
  .command('complete [id]')
  .description('Mark a task as completed and move to tasks/completed/')
  .option('-s, --summary <summary>', 'Summary of final delivery')
  .action(runTaskComplete);

taskCmd
  .command('block <id>')
  .description('Mark a task as blocked with a specific reason')
  .requiredOption('-r, --reason <reason>', 'Reason for blocker')
  .action((id, opts) => runTaskBlock(id, { reason: opts.reason }));

taskCmd
  .command('list')
  .description('List all active, completed, and blocked tasks')
  .action(runTaskList);

// decision
program
  .command('decision [title]')
  .description('Record or list Architecture Decision Records (ADRs)')
  .option('-d, --decision <decision>', 'The decision statement')
  .option('-w, --why <why>', 'Why this decision was made')
  .option('-a, --alternatives <items>', 'Comma-separated alternatives considered')
  .option('-r, --rejected <reason>', 'Why alternatives were rejected')
  .option('-l, --list', 'List all recorded decisions')
  .action(runDecision);

// log
program
  .command('log <message>')
  .description('Quickly log an architectural or permanent decision to .continuity/decisions/')
  .action(runLog);

// failure
const failureCmd = program.command('failure').description('Record and view failed approaches to prevent repetition');
failureCmd
  .command('record <title>')
  .description('Record a failed approach with reasons and lessons learned')
  .option('-a, --attempt <attempt>', 'What was attempted')
  .option('-r, --result <result>', 'Outcome / what broke')
  .option('-w, --why <why>', 'Why it failed')
  .option('-d, --do-not-repeat <doNotRepeat>', 'Rule on what not to repeat')
  .option('-b, --better <betterApproach>', 'Recommended better approach')
  .option('-f, --files <items>', 'Comma-separated related files')
  .action((title, opts) => runFailure(title, opts));

failureCmd
  .command('list')
  .description('List all documented failed approaches')
  .action(() => runFailure(undefined, { list: true }));

// checkpoint
program
  .command('checkpoint [name]')
  .description('Capture a point-in-time snapshot of the current state, commit, and task context')
  .action(runCheckpoint);

// restore-context
program
  .command('restore-context <id>')
  .description('Restore project work-state from a historical checkpoint snapshot')
  .action(runRestoreContext);

// explain
program
  .command('explain <file>')
  .description('Explain why a file exists, its purpose, related tasks, ADRs, and historical changes')
  .option('--json', 'Output machine-readable JSON')
  .action(runExplain);

// search
program
  .command('search <query>')
  .description('Search across all continuity documents using SQLite FTS5')
  .option('-t, --type <type>', 'Filter by type (task, decision, session, failure, etc.)')
  .option('-l, --limit <number>', 'Maximum matches')
  .option('--reindex', 'Force complete re-indexing before search')
  .action(runSearch);

// doctor
program
  .command('doctor')
  .description('Run health checks on .continuity/, git status, secret scanning, and file integrity')
  .action(runDoctor);

// export
program
  .command('export')
  .description('Export all project continuity context into a single Markdown or JSON bundle')
  .option('-o, --output <file>', 'Output file path')
  .option('--json', 'Export as structured JSON')
  .action(runExport);

// done
program
  .command('done')
  .description('Finalize the current session, record summary, and generate handover in one command')
  .option('-s, --summary <summary>', 'Summary of work accomplished')
  .option('--next-file <file>', 'Next file to open')
  .option('--next-problem <problem>', 'Next problem to address')
  .option('--next-solution <solution>', 'Expected solution approach')
  .option('-a, --agent <agent>', 'Agent identifier')
  .action(runDone);

program.parse(process.argv);
