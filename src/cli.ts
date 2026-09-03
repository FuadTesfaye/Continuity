#!/usr/bin/env node

import { Command } from 'commander';
import pc from 'picocolors';
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
import {
  runPlanCreate,
  runPlanList,
  runPlanShow,
  runPlanUpdate
} from './cli/commands/plan.js';
import { runGitCommand } from './cli/commands/git.js';
import { runHistoryCommand } from './cli/commands/history.js';
import { runDiffCommand } from './cli/commands/diff.js';
import { runVerify } from './cli/commands/verify.js';
import { runPromptCommand } from './cli/commands/prompt.js';
import { runDecision, runLog } from './cli/commands/decision.js';
import { runFailure } from './cli/commands/failure.js';
import { runCheckpoint, runRestoreContext } from './cli/commands/checkpoint.js';
import { runExplain } from './cli/commands/explain.js';
import { runSearch } from './cli/commands/search.js';
import { runDoctor } from './cli/commands/doctor.js';
import { runExport } from './cli/commands/export.js';
import { runDone } from './cli/commands/done.js';
import { runProfile } from './cli/commands/profile.js';
import { runDevice } from './cli/commands/device.js';
import { runToolchain } from './cli/commands/toolchain.js';
import { runAccount } from './cli/commands/account.js';
import { runProjects, runProjectRegister, runProjectClassify } from './cli/commands/projects.js';
import { runKnowledge } from './cli/commands/knowledge.js';
import { runBootstrap } from './cli/commands/bootstrap.js';

const program = new Command();

program
  .name('continuity')
  .description('Persistent project-context and work-state system for multi-agent and human AI collaboration')
  .version('0.3.0');

// init
program
  .command('init')
  .description('Initialize Continuity in the current repository')
  .option('-n, --name <name>', 'Project name')
  .option('-d, --description <desc>', 'Project purpose and description')
  .option('-s, --stack <items...>', 'Key technologies / stack items')
  .option('-t, --type <type>', 'Project category (personal, client, work, open-source, learning, experimental)')
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
  .option('--scope <scope>', 'Context scope boundary: task, project, developer, global', 'project')
  .action(runResume);

// prompt
program
  .command('prompt [task]')
  .description('Generate ranked 6-source AI prompt payload ready to pipe to any agent CLI')
  .action(runPromptCommand);

// bootstrap
program
  .command('bootstrap')
  .description('Verify machine toolchain requirements against project dependencies and advise fixes')
  .option('--generate <format>', 'Generate toolchain config: mise, nvm, tool-versions')
  .action(runBootstrap);

// profile
program
  .command('profile')
  .description('View and manage global developer profile and preferences (~/.continuity/profile)')
  .option('--json', 'Output structured JSON')
  .action(runProfile);

// device
program
  .command('device')
  .description('Inspect machine hardware, runtimes, tools, shell, and detect environment drift')
  .option('--sync', 'Synchronize current live environment to ~/.continuity/devices/')
  .option('--json', 'Output structured JSON')
  .action(runDevice);

// toolchain
program
  .command('toolchain')
  .description('Display hierarchical toolchain resolution (Global Default -> Project Config -> Task Override)')
  .option('--json', 'Output structured JSON')
  .action(runToolchain);

// account
program
  .command('account')
  .description('View developer account profiles (GitHub, npm, Docker) with secure keychain references')
  .option('-p, --provider <provider>', 'Filter by provider (github, npm, docker, aws)')
  .option('--json', 'Output AI-safe sanitized JSON')
  .action(runAccount);

// projects
program
  .command('projects')
  .description('List all registered projects across the machine, grouped by category')
  .option('-c, --category <category>', 'Filter by category (personal, client, work, open-source)')
  .option('--json', 'Output structured JSON')
  .action(runProjects);

// project
const projectCmd = program.command('project').description('Register and classify projects in global registry');
projectCmd
  .command('register [path]')
  .description('Register a project directory in the global registry (~/.continuity/projects)')
  .action(runProjectRegister);

projectCmd
  .command('classify <type>')
  .description('Update project category (personal, client, work, open-source, learning, experimental)')
  .option('-c, --client <name>', 'Client name (for client work isolation)')
  .action((type, opts) => runProjectClassify(type, opts.client));

// knowledge
program
  .command('knowledge [category]')
  .description('Query cross-project technical lessons and architectural patterns (~/.continuity/knowledge)')
  .option('--json', 'Output structured JSON')
  .action((cat, opts) => runKnowledge(cat, opts));

// plan
const planCmd = program.command('plan').description('Manage persistent architectural and implementation plans');
planCmd
  .command('create <title>')
  .description('Create a new persistent plan with goals, steps, constraints, and criteria')
  .option('-g, --goal <goal>', 'Plan goal statement')
  .option('-s, --steps <items>', 'Comma-separated plan steps')
  .option('-c, --constraints <items>', 'Comma-separated architectural constraints')
  .option('-a, --criteria <items>', 'Comma-separated acceptance criteria')
  .option('--scope <items>', 'Comma-separated scope boundaries')
  .action(runPlanCreate);

planCmd
  .command('list')
  .description('List all active, blocked, completed, and abandoned plans')
  .action(runPlanList);

planCmd
  .command('show <id>')
  .description('Show full details, steps, constraints, and criteria of a plan')
  .action(runPlanShow);

planCmd
  .command('update <id>')
  .description('Update plan steps, status, or acceptance criteria')
  .option('--complete-step <number>', 'Mark step number as completed')
  .option('--satisfy-criterion <number>', 'Mark acceptance criterion number as satisfied')
  .option('--step-name <name>', 'Update current step name')
  .option('--block <reason>', 'Mark plan as blocked with reason')
  .option('--abandon <reason>', 'Mark plan as abandoned with reason')
  .action(runPlanUpdate);

// verify
program
  .command('verify [planId]')
  .description('Verify plan steps, acceptance criteria, git working tree, and test execution')
  .option('--test', 'Run project test suite as part of verification')
  .action((planId, opts) => runVerify(planId, opts));

// git
program
  .command('git')
  .description('Inspect current repository branch, commit, status, and recent commits (Levels 1 & 2)')
  .action(runGitCommand);

// history
program
  .command('history <path>')
  .description('Inspect temporal evolution, releases, tags, and commits for a file or module')
  .option('-s, --symbol <symbol>', 'Search when a specific symbol or function was changed (Pickaxe archaeology)')
  .option('-l, --limit <number>', 'Maximum commits to display', '15')
  .action((path, opts) => runHistoryCommand(path, opts));

// diff
program
  .command('diff [files...]')
  .description('Display context-aware smart diff of working tree changes')
  .action(runDiffCommand);

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
  .description('Run health checks on .continuity/, git status, secret scanning, and environment drift')
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

program.helpInformation = () => {
  return `
${pc.bold(pc.cyan('======================================================================'))}
  ${pc.bold(pc.white('CONTINUITY 🔄 — Portable Project Context & Work-State System (v3)'))}
${pc.bold(pc.cyan('======================================================================'))}

  ${pc.gray('Two-Memory Architecture:')}
  ${pc.cyan('Global Memory')} (~/.continuity)   • Developer Profile, Machine Devices, Accounts, Knowledge, Projects
  ${pc.green('Project Memory')} (.continuity)    • State, Plans, Tasks, Git History, Sessions, ADRs, Handover

${pc.bold(pc.yellow('USAGE:'))}
  $ continuity <command> [options]

${pc.bold(pc.yellow('COMMANDS BY CATEGORY:'))}

  ${pc.bold(pc.cyan('🌐 GLOBAL DEVELOPER & MACHINE MEMORY (~/.continuity)'))}
    ${pc.green('profile')}               View developer bio & preferences (~/.continuity/profile)
    ${pc.green('device')} [--sync]       Inspect OS, CPU, runtimes, tools, and detect environment drift
    ${pc.green('toolchain')}             Resolve effective toolchain (Global Default -> Project -> Task)
    ${pc.green('account')}               Account profiles & secure keychain references (Zero plain secrets)
    ${pc.green('projects')}              Registry of all local repositories by category (Client, Work, Personal)
    ${pc.green('project')} <cmd>         Register or classify projects in the global registry
    ${pc.green('knowledge')} [category]  Cross-project technical lessons & architectural notes
    ${pc.green('bootstrap')}             Check machine tools against project needs & generate config files

  ${pc.bold(pc.cyan('🚀 PROJECT SETUP & HEALTH'))}
    ${pc.green('init')} [--type <type>]  Initialize Continuity, protocol, and AI agent adapters
    ${pc.green('status')}                Show current branch, active task, progress %, and next action
    ${pc.green('doctor')}                Validate project health, git state, secret leaks, and machine drift

  ${pc.bold(pc.cyan('📋 PLANS & TASKS (LIFECYCLE)'))}
    ${pc.green('plan create')} <title>    Create persistent plan with goals, steps, criteria, constraints
    ${pc.green('plan list')}             List active, blocked, completed, and abandoned plans
    ${pc.green('plan show')} <id>         Show full plan steps checklist and acceptance criteria
    ${pc.green('plan update')} <id>       Advance steps, mark criteria satisfied, or update status
    ${pc.green('task start')} <title>     Start an active task with checklist and target files
    ${pc.green('task update')} [id]       Update task progress, completed items, or blockers
    ${pc.green('task complete')} [id]     Mark active task finished and archive to tasks/completed/
    ${pc.green('task list')}             List active, completed, and blocked tasks

  ${pc.bold(pc.cyan('🔍 GIT CONTEXT & ARCHAEOLOGY'))}
    ${pc.green('git')}                   Inspect branch, HEAD commit, uncommitted stats, and recent commits
    ${pc.green('history')} <path>        Temporal evolution of a file/module across commits and tags
    ${pc.green('history')} <p> -s <sym>  Pickaxe archaeology: find exact commit introducing a symbol
    ${pc.green('diff')} [files...]       Context-aware smart diff of working tree changes

  ${pc.bold(pc.cyan('🧠 KNOWLEDGE, MEMORY & SEARCH'))}
    ${pc.green('session save')}          Record session summary, changes, decisions, and raw transcript
    ${pc.green('session list')}          View historical developer and AI sessions
    ${pc.green('decision')} [title]      Record or list Architecture Decision Records (ADRs)
    ${pc.green('log')} <message>         Quickly append an architectural decision to ADRs
    ${pc.green('failure record')}        Document failed attempts and "Do Not Repeat" lessons
    ${pc.green('failure list')}          Review all recorded failure post-mortems
    ${pc.green('context')} <query>       Ask questions about past decisions, sessions, architecture
    ${pc.green('search')} <query>        Fast full-text search across all markdown files via SQLite FTS5
    ${pc.green('explain')} <file>        Show file provenance, related tasks, ADRs, and commit history
    ${pc.green('checkpoint')} [name]     Snapshot point-in-time state and context
    ${pc.green('restore-context')} <id>  Roll back work-state to a previous checkpoint
    ${pc.green('export')}                Bundle all continuity context into a single Markdown or JSON file

  ${pc.bold(pc.cyan('🤖 AI RESUME, VERIFICATION & HANDOVER'))}
    ${pc.green('resume')} [--scope <s>]  Compile compact 6-source context for any AI agent to continue
    ${pc.green('prompt')} [task]         Generate ranked context payload ready to pipe to any LLM CLI
    ${pc.green('verify')} [planId]       Evaluate plan steps, criteria, git changes, and test suite
    ${pc.green('handover')}              Package current work into an actionable continuation package
    ${pc.green('done')}                  One-step wrapup: record summary and generate handover

${pc.bold(pc.yellow('WORKFLOW DEMONSTRATION:'))}
  ${pc.gray('# 1. Check machine environment readiness for project:')}
  $ continuity bootstrap

  ${pc.gray('# 2. Start session or let any AI inspect context with scope:')}
  $ continuity resume --scope project

  ${pc.gray('# 3. Query why code exists with Git archaeology:')}
  $ continuity history src/auth/service.ts --symbol verifyRefreshToken

  ${pc.gray('# 4. Establish a multi-step persistent plan:')}
  $ continuity plan create "Auth Refactor" --goal "JWT + rotation" \\
      --steps "Middleware,Token service,Revocation" \\
      --criteria "Tokens expire in 15m,Replay rejected"

  ${pc.gray('# 5. Check off steps as you implement code:')}
  $ continuity plan update auth-refactor --complete-step 1

  ${pc.gray('# 6. Verify completeness before concluding session:')}
  $ continuity verify --test

  ${pc.gray('# 7. Handover to next AI agent without knowledge loss:')}
  $ continuity done --summary "Completed middleware, ready for token service"
`;
};

if (process.argv.length <= 2) {
  console.log(program.helpInformation());
  process.exit(0);
}

program.parse(process.argv);
