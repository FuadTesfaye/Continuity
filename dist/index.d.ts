import { z } from 'zod';

declare const ContinuityConfigSchema: z.ZodObject<{
    version: z.ZodDefault<z.ZodNumber>;
    git: z.ZodDefault<z.ZodObject<{
        track: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        ignore: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        track: string[];
        ignore: string[];
    }, {
        track?: string[] | undefined;
        ignore?: string[] | undefined;
    }>>;
    redaction: z.ZodDefault<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        files: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        patterns: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        files: string[];
        patterns: string[];
    }, {
        enabled?: boolean | undefined;
        files?: string[] | undefined;
        patterns?: string[] | undefined;
    }>>;
    ai: z.ZodDefault<z.ZodObject<{
        defaultModel: z.ZodOptional<z.ZodString>;
        instructionsFile: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        instructionsFile: string;
        defaultModel?: string | undefined;
    }, {
        defaultModel?: string | undefined;
        instructionsFile?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    version: number;
    git: {
        track: string[];
        ignore: string[];
    };
    redaction: {
        enabled: boolean;
        files: string[];
        patterns: string[];
    };
    ai: {
        instructionsFile: string;
        defaultModel?: string | undefined;
    };
}, {
    version?: number | undefined;
    git?: {
        track?: string[] | undefined;
        ignore?: string[] | undefined;
    } | undefined;
    redaction?: {
        enabled?: boolean | undefined;
        files?: string[] | undefined;
        patterns?: string[] | undefined;
    } | undefined;
    ai?: {
        defaultModel?: string | undefined;
        instructionsFile?: string | undefined;
    } | undefined;
}>;
type ContinuityConfig = z.infer<typeof ContinuityConfigSchema>;

declare const TaskStatusSchema: z.ZodEnum<["active", "completed", "blocked"]>;
type TaskStatus = z.infer<typeof TaskStatusSchema>;
declare const TaskItemSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    status: z.ZodDefault<z.ZodEnum<["active", "completed", "blocked"]>>;
    progress: z.ZodDefault<z.ZodNumber>;
    description: z.ZodOptional<z.ZodString>;
    completed: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    remaining: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    blockers: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    relatedFiles: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    completedAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "active" | "completed" | "blocked";
    completed: string[];
    id: string;
    title: string;
    progress: number;
    remaining: string[];
    blockers: string[];
    relatedFiles: string[];
    createdAt: string;
    updatedAt: string;
    description?: string | undefined;
    completedAt?: string | undefined;
}, {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    status?: "active" | "completed" | "blocked" | undefined;
    completed?: string[] | undefined;
    progress?: number | undefined;
    description?: string | undefined;
    remaining?: string[] | undefined;
    blockers?: string[] | undefined;
    relatedFiles?: string[] | undefined;
    completedAt?: string | undefined;
}>;
type TaskItem = z.infer<typeof TaskItemSchema>;

declare const DecisionSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    status: z.ZodDefault<z.ZodEnum<["proposed", "accepted", "superseded", "deprecated"]>>;
    date: z.ZodString;
    decision: z.ZodString;
    why: z.ZodString;
    alternatives: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    rejectedBecause: z.ZodOptional<z.ZodString>;
    implications: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    author: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "proposed" | "accepted" | "superseded" | "deprecated";
    id: string;
    title: string;
    date: string;
    decision: string;
    why: string;
    alternatives: string[];
    implications: string[];
    rejectedBecause?: string | undefined;
    author?: string | undefined;
}, {
    id: string;
    title: string;
    date: string;
    decision: string;
    why: string;
    status?: "proposed" | "accepted" | "superseded" | "deprecated" | undefined;
    alternatives?: string[] | undefined;
    rejectedBecause?: string | undefined;
    implications?: string[] | undefined;
    author?: string | undefined;
}>;
type Decision = z.infer<typeof DecisionSchema>;

declare const FailureSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    date: z.ZodString;
    attempt: z.ZodString;
    result: z.ZodString;
    why: z.ZodString;
    doNotRepeat: z.ZodString;
    betterApproach: z.ZodString;
    relatedTask: z.ZodOptional<z.ZodString>;
    relatedFiles: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    id: string;
    title: string;
    relatedFiles: string[];
    date: string;
    why: string;
    attempt: string;
    result: string;
    doNotRepeat: string;
    betterApproach: string;
    relatedTask?: string | undefined;
}, {
    id: string;
    title: string;
    date: string;
    why: string;
    attempt: string;
    result: string;
    doNotRepeat: string;
    betterApproach: string;
    relatedFiles?: string[] | undefined;
    relatedTask?: string | undefined;
}>;
type Failure = z.infer<typeof FailureSchema>;

declare const SessionSummarySchema: z.ZodObject<{
    id: z.ZodString;
    date: z.ZodString;
    agent: z.ZodDefault<z.ZodString>;
    branch: z.ZodDefault<z.ZodString>;
    task: z.ZodOptional<z.ZodString>;
    objective: z.ZodString;
    workCompleted: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    filesChanged: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    decisions: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    failedApproaches: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    problems: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    nextStep: z.ZodOptional<z.ZodString>;
    importantContext: z.ZodOptional<z.ZodString>;
    gitCommit: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    date: string;
    agent: string;
    branch: string;
    objective: string;
    workCompleted: string[];
    filesChanged: string[];
    decisions: string[];
    failedApproaches: string[];
    problems: string[];
    task?: string | undefined;
    nextStep?: string | undefined;
    importantContext?: string | undefined;
    gitCommit?: string | undefined;
}, {
    id: string;
    date: string;
    objective: string;
    agent?: string | undefined;
    branch?: string | undefined;
    task?: string | undefined;
    workCompleted?: string[] | undefined;
    filesChanged?: string[] | undefined;
    decisions?: string[] | undefined;
    failedApproaches?: string[] | undefined;
    problems?: string[] | undefined;
    nextStep?: string | undefined;
    importantContext?: string | undefined;
    gitCommit?: string | undefined;
}>;
type SessionSummary = z.infer<typeof SessionSummarySchema>;
interface RawSession {
    id: string;
    date: string;
    agent: string;
    content: string;
}

declare const NextActionSchema: z.ZodObject<{
    file: z.ZodOptional<z.ZodString>;
    focus: z.ZodOptional<z.ZodString>;
    problem: z.ZodString;
    expectedSolution: z.ZodString;
    constraints: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    problem: string;
    expectedSolution: string;
    constraints: string[];
    file?: string | undefined;
    focus?: string | undefined;
}, {
    problem: string;
    expectedSolution: string;
    file?: string | undefined;
    focus?: string | undefined;
    constraints?: string[] | undefined;
}>;
type NextAction = z.infer<typeof NextActionSchema>;
declare const HandoverSchema: z.ZodObject<{
    id: z.ZodString;
    date: z.ZodString;
    project: z.ZodString;
    branch: z.ZodString;
    commit: z.ZodOptional<z.ZodString>;
    currentTask: z.ZodOptional<z.ZodString>;
    progress: z.ZodDefault<z.ZodNumber>;
    completed: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    remaining: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    modifiedFiles: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    uncommittedChanges: z.ZodDefault<z.ZodBoolean>;
    decisions: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    problems: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    failedApproaches: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    nextAction: z.ZodObject<{
        file: z.ZodOptional<z.ZodString>;
        focus: z.ZodOptional<z.ZodString>;
        problem: z.ZodString;
        expectedSolution: z.ZodString;
        constraints: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        problem: string;
        expectedSolution: string;
        constraints: string[];
        file?: string | undefined;
        focus?: string | undefined;
    }, {
        problem: string;
        expectedSolution: string;
        file?: string | undefined;
        focus?: string | undefined;
        constraints?: string[] | undefined;
    }>;
    author: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    completed: string[];
    id: string;
    progress: number;
    remaining: string[];
    date: string;
    author: string;
    branch: string;
    decisions: string[];
    failedApproaches: string[];
    problems: string[];
    project: string;
    modifiedFiles: string[];
    uncommittedChanges: boolean;
    nextAction: {
        problem: string;
        expectedSolution: string;
        constraints: string[];
        file?: string | undefined;
        focus?: string | undefined;
    };
    commit?: string | undefined;
    currentTask?: string | undefined;
}, {
    id: string;
    date: string;
    branch: string;
    project: string;
    nextAction: {
        problem: string;
        expectedSolution: string;
        file?: string | undefined;
        focus?: string | undefined;
        constraints?: string[] | undefined;
    };
    completed?: string[] | undefined;
    progress?: number | undefined;
    remaining?: string[] | undefined;
    author?: string | undefined;
    decisions?: string[] | undefined;
    failedApproaches?: string[] | undefined;
    problems?: string[] | undefined;
    commit?: string | undefined;
    currentTask?: string | undefined;
    modifiedFiles?: string[] | undefined;
    uncommittedChanges?: boolean | undefined;
}>;
type Handover = z.infer<typeof HandoverSchema>;

declare const ProjectInfoSchema: z.ZodObject<{
    name: z.ZodString;
    purpose: z.ZodDefault<z.ZodString>;
    stack: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    architecture: z.ZodDefault<z.ZodString>;
    database: z.ZodOptional<z.ZodString>;
    infrastructure: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    repository: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    purpose: string;
    stack: string[];
    architecture: string;
    infrastructure: string[];
    database?: string | undefined;
    repository?: string | undefined;
}, {
    name: string;
    purpose?: string | undefined;
    stack?: string[] | undefined;
    architecture?: string | undefined;
    database?: string | undefined;
    infrastructure?: string[] | undefined;
    repository?: string | undefined;
}>;
type ProjectInfo = z.infer<typeof ProjectInfoSchema>;
declare const ContinuityStateSchema: z.ZodObject<{
    project: z.ZodString;
    currentBranch: z.ZodDefault<z.ZodString>;
    currentTask: z.ZodDefault<z.ZodString>;
    status: z.ZodDefault<z.ZodString>;
    progress: z.ZodDefault<z.ZodNumber>;
    completed: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    remaining: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    currentFiles: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    currentBlocker: z.ZodDefault<z.ZodNullable<z.ZodString>>;
    lastAction: z.ZodDefault<z.ZodString>;
    nextAction: z.ZodDefault<z.ZodUnion<[z.ZodObject<{
        file: z.ZodOptional<z.ZodString>;
        focus: z.ZodOptional<z.ZodString>;
        problem: z.ZodString;
        expectedSolution: z.ZodString;
        constraints: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        problem: string;
        expectedSolution: string;
        constraints: string[];
        file?: string | undefined;
        focus?: string | undefined;
    }, {
        problem: string;
        expectedSolution: string;
        file?: string | undefined;
        focus?: string | undefined;
        constraints?: string[] | undefined;
    }>, z.ZodString]>>;
    lastSession: z.ZodOptional<z.ZodString>;
    lastCommit: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: string;
    completed: string[];
    progress: number;
    remaining: string[];
    updatedAt: string;
    project: string;
    currentTask: string;
    nextAction: string | {
        problem: string;
        expectedSolution: string;
        constraints: string[];
        file?: string | undefined;
        focus?: string | undefined;
    };
    currentBranch: string;
    currentFiles: string[];
    currentBlocker: string | null;
    lastAction: string;
    lastSession?: string | undefined;
    lastCommit?: string | undefined;
}, {
    updatedAt: string;
    project: string;
    status?: string | undefined;
    completed?: string[] | undefined;
    progress?: number | undefined;
    remaining?: string[] | undefined;
    currentTask?: string | undefined;
    nextAction?: string | {
        problem: string;
        expectedSolution: string;
        file?: string | undefined;
        focus?: string | undefined;
        constraints?: string[] | undefined;
    } | undefined;
    currentBranch?: string | undefined;
    currentFiles?: string[] | undefined;
    currentBlocker?: string | null | undefined;
    lastAction?: string | undefined;
    lastSession?: string | undefined;
    lastCommit?: string | undefined;
}>;
type ContinuityState = z.infer<typeof ContinuityStateSchema>;

interface GitCommitInfo {
    hash: string;
    shortHash: string;
    message: string;
    author: string;
    date: string;
}
interface GitStatusInfo {
    isGitRepo: boolean;
    branch: string;
    commit?: GitCommitInfo;
    modifiedFiles: string[];
    stagedFiles: string[];
    untrackedFiles: string[];
    hasUncommittedChanges: boolean;
}
declare class GitClient {
    private readonly cwd;
    constructor(cwd?: string);
    private runGit;
    isGitRepository(): Promise<boolean>;
    getCurrentBranch(): Promise<string>;
    getLatestCommit(): Promise<GitCommitInfo | undefined>;
    getStatus(): Promise<GitStatusInfo>;
    getDiff(cached?: boolean): Promise<string>;
    getChangedFilesSince(commitHash?: string): Promise<string[]>;
    getFileCommits(filePath: string, limit?: number): Promise<Array<{
        hash: string;
        message: string;
        date: string;
    }>>;
}

interface RedactionResult {
    text: string;
    redactedCount: number;
    detections: string[];
}
declare class SecretRedactor {
    private patterns;
    private restrictedFileGlobs;
    constructor(customPatterns?: Array<{
        name: string;
        regex: string;
        replacement: string;
    }>);
    isRestrictedFile(filePath: string): boolean;
    redact(input: string): RedactionResult;
}

declare class FileSystem {
    readonly rootDir: string;
    constructor(rootDir?: string);
    get continuityDir(): string;
    resolve(...subpaths: string[]): string;
    resolveContinuity(...subpaths: string[]): string;
    exists(filePath: string): boolean;
    isInitialized(): boolean;
    ensureDir(dirPath: string): Promise<void>;
    readFile(filePath: string): Promise<string>;
    writeFile(filePath: string, content: string): Promise<void>;
    listFiles(dirPath: string, extension?: string): Promise<string[]>;
    deleteFile(filePath: string): Promise<void>;
    moveFile(srcPath: string, destPath: string): Promise<void>;
    copyFile(srcPath: string, destPath: string): Promise<void>;
}

interface ParsedMarkdown<T = Record<string, any>> {
    data: T;
    content: string;
}
declare class MarkdownHelper {
    static parse<T = Record<string, any>>(rawContent: string): ParsedMarkdown<T>;
    static stringify<T = Record<string, any>>(content: string, data?: T): string;
    /**
     * Extracts top-level or H2 sections from markdown text
     */
    static extractSections(markdown: string): Map<string, string>;
    /**
     * Parses Markdown bullet list into string array
     */
    static parseBulletList(text: string): string[];
    /**
     * Formats string array into Markdown bullet list
     */
    static formatBulletList(items: string[], bullet?: string): string;
    /**
     * Formats checked bullet list (✓ / □)
     */
    static formatChecklist(items: Array<{
        title: string;
        completed: boolean;
    }>): string;
}

interface SearchResult {
    path: string;
    relativePath: string;
    type: string;
    title: string;
    snippet: string;
    score: number;
}
interface IndexedDocument {
    path: string;
    relativePath: string;
    type: string;
    title: string;
    content: string;
    modifiedAt: number;
}
declare class SQLiteIndexer {
    private readonly fs;
    private db;
    private isNodeSqliteAvailable;
    private inMemoryFallbackDocs;
    constructor(fs: FileSystem);
    init(): Promise<void>;
    private setupTables;
    determineType(relativePath: string): string;
    extractTitle(content: string, fallback: string): string;
    indexFile(filePath: string): Promise<void>;
    reindexAll(): Promise<number>;
    search(query: string, options?: {
        type?: string;
        limit?: number;
    }): SearchResult[];
    private fallbackSearch;
    close(): void;
}

declare class StateManager {
    private readonly fs;
    constructor(fs: FileSystem);
    getState(): Promise<ContinuityState>;
    saveState(state: Partial<ContinuityState>): Promise<ContinuityState>;
    getProjectInfo(): Promise<ProjectInfo>;
    getArchitecture(): Promise<string>;
    private parseStateMarkdown;
    private formatStateMarkdown;
}

declare class TaskManager {
    private readonly fs;
    private readonly stateManager;
    constructor(fs: FileSystem, stateManager: StateManager);
    private slugify;
    private getTaskDir;
    startTask(title: string, options?: {
        description?: string;
        remaining?: string[];
        relatedFiles?: string[];
    }): Promise<TaskItem>;
    updateTask(id: string, updates: {
        progress?: number;
        addCompleted?: string[];
        addRemaining?: string[];
        removeRemaining?: string[];
        blocker?: string | null;
        relatedFiles?: string[];
    }): Promise<TaskItem>;
    completeTask(id: string, summary?: string): Promise<TaskItem>;
    blockTask(id: string, reason: string): Promise<TaskItem>;
    getTask(id: string): Promise<TaskItem | undefined>;
    listTasks(): Promise<{
        active: TaskItem[];
        completed: TaskItem[];
        blocked: TaskItem[];
    }>;
    private saveTaskFile;
    private formatTaskMarkdown;
    private parseTaskMarkdown;
}

declare class DecisionManager {
    private readonly fs;
    constructor(fs: FileSystem);
    private get decisionsDir();
    private slugify;
    getNextAdrId(): Promise<string>;
    recordDecision(data: {
        title: string;
        decision: string;
        why: string;
        alternatives?: string[];
        rejectedBecause?: string;
        author?: string;
    }): Promise<Decision>;
    listDecisions(): Promise<Decision[]>;
    getDecision(id: string): Promise<Decision | undefined>;
    private formatDecisionMarkdown;
    private parseDecisionMarkdown;
}

declare class FailureManager {
    private readonly fs;
    constructor(fs: FileSystem);
    private get failuresDir();
    private slugify;
    recordFailure(data: {
        title: string;
        attempt: string;
        result: string;
        why: string;
        doNotRepeat: string;
        betterApproach: string;
        relatedTask?: string;
        relatedFiles?: string[];
    }): Promise<Failure>;
    listFailures(): Promise<Failure[]>;
    private formatFailureMarkdown;
    private parseFailureMarkdown;
}

declare class SessionManager {
    private readonly fs;
    private readonly stateManager;
    private redactor;
    constructor(fs: FileSystem, stateManager: StateManager);
    private get sessionsDir();
    private getDateParts;
    saveSession(data: {
        agent?: string;
        branch?: string;
        task?: string;
        objective: string;
        workCompleted?: string[];
        filesChanged?: string[];
        decisions?: string[];
        failedApproaches?: string[];
        problems?: string[];
        nextStep?: string;
        importantContext?: string;
        gitCommit?: string;
    }, rawContent?: string): Promise<SessionSummary>;
    listSessions(): Promise<SessionSummary[]>;
    getLatestSession(): Promise<SessionSummary | undefined>;
    private formatSessionMarkdown;
    private parseSessionMarkdown;
}

declare class HandoverManager {
    private readonly fs;
    private readonly git;
    private readonly stateManager;
    private readonly decisionManager;
    private readonly failureManager;
    private redactor;
    constructor(fs: FileSystem, git: GitClient, stateManager: StateManager, decisionManager: DecisionManager, failureManager: FailureManager);
    private get handoversDir();
    createHandover(data: {
        currentTask?: string;
        progress?: number;
        completed?: string[];
        remaining?: string[];
        problems?: string[];
        decisions?: string[];
        failedApproaches?: string[];
        nextAction: NextAction;
        author?: string;
    }): Promise<Handover>;
    getLatestHandover(): Promise<Handover | undefined>;
    private formatHandoverMarkdown;
    private parseHandoverMarkdown;
}

interface ResumeContext {
    project: string;
    purpose: string;
    architectureSummary: string;
    branch: string;
    commit?: string;
    currentTask: string;
    progress: number;
    completed: string[];
    remaining: string[];
    currentBlocker?: string | null;
    relevantFiles: string[];
    previousFailedApproaches: string[];
    recentDecisions: string[];
    lastSession?: string;
    nextAction: {
        file?: string;
        focus?: string;
        problem: string;
        expectedSolution: string;
        constraints: string[];
    };
    hasUncommittedChanges: boolean;
}
declare class ResumeEngine {
    private readonly stateManager;
    private readonly handoverManager;
    private readonly sessionManager;
    private readonly failureManager;
    private readonly decisionManager;
    private readonly git;
    constructor(stateManager: StateManager, handoverManager: HandoverManager, sessionManager: SessionManager, failureManager: FailureManager, decisionManager: DecisionManager, git: GitClient);
    buildContext(): Promise<ResumeContext>;
    formatCompact(ctx: ResumeContext): string;
    formatFullMarkdown(ctx: ResumeContext): string;
}

interface FileExplanation {
    filePath: string;
    exists: boolean;
    purpose: string;
    introducedDate?: string;
    introducedCommit?: string;
    lastModifiedDate?: string;
    lastModifiedCommit?: string;
    relatedTasks: string[];
    relatedDecisions: string[];
    knownFailures: string[];
    sessionMentionsCount: number;
}
declare class ExplainEngine {
    private readonly fs;
    private readonly git;
    private readonly taskManager;
    private readonly decisionManager;
    private readonly failureManager;
    private readonly sessionManager;
    constructor(fs: FileSystem, git: GitClient, taskManager: TaskManager, decisionManager: DecisionManager, failureManager: FailureManager, sessionManager: SessionManager);
    explain(targetPath: string): Promise<FileExplanation>;
    formatExplanation(exp: FileExplanation): string;
}

interface DoctorCheck {
    name: string;
    passed: boolean;
    message: string;
    warning?: boolean;
}
interface DoctorReport {
    overallHealthy: boolean;
    checks: DoctorCheck[];
}
declare class DoctorEngine {
    private readonly fs;
    private readonly git;
    private readonly stateManager;
    private readonly taskManager;
    private redactor;
    constructor(fs: FileSystem, git: GitClient, stateManager: StateManager, taskManager: TaskManager);
    runDiagnostics(): Promise<DoctorReport>;
}

declare const DEFAULT_CONTINUITY_MD = "# Continuity Protocol\n\nThis project uses the **Continuity** persistent context and work-state system.\nContinuity is the portable, machine-readable and human-readable source of truth about the work.\n\n## Before Working (Session Start)\n1. Run `continuity resume` (or inspect `.continuity/state.md`).\n2. Read `.continuity/project.md` and `.continuity/architecture.md` to understand system boundaries.\n3. Inspect Git status: `git status` to check for any uncommitted changes or current branch.\n4. Read the **Next Action** recorded in `.continuity/state.md` and continue directly from it.\n5. Check `.continuity/failures/` to make sure you do NOT attempt previously failed approaches.\n\n## While Working\n- Respect existing architectural decisions recorded in `.continuity/decisions/`.\n- If an approach fails, record it with `continuity failure record`.\n- If you make a significant architectural or design decision, log it with `continuity decision`.\n- Update task progress as you complete checklist items: `continuity task update`.\n\n## After Completing Work (Session End)\n1. Run `continuity handover` or `continuity done` to capture:\n   - What was completed\n   - What remains\n   - Files changed\n   - Known blockers or bugs\n   - Concrete, actionable **Next Action** (file, problem, expected solution, and constraints)\n2. Save your session record: `continuity session save`.\n\nDo not make the next AI or developer ask \"What were we doing?\". Leave the project ready to continue.\n";
declare const DEFAULT_PROJECT_MD: (projectName: string, description?: string, stack?: string[]) => string;
declare const DEFAULT_STATE_MD: (projectName: string, branch?: string) => string;
declare const DEFAULT_ARCHITECTURE_MD: (projectName: string) => string;
declare const DEFAULT_ROADMAP_MD = "# Product & Technical Roadmap\n\n## Phase 1: Core Functionality\n- [x] Repository initialization and continuity setup\n- [ ] Core feature implementation\n- [ ] Automated testing suite\n\n## Phase 2: Refinement & Scale\n- [ ] Integration and performance testing\n- [ ] Production deployment\n";
declare const DEFAULT_INDEX_MD = "# Continuity Index\n\nThis directory holds the persistent state and memory for the project.\n\n- **[Current State](state.md)**: Live state of current branch, task, progress, and next action.\n- **[Project Identity](project.md)**: Project purpose, tech stack, and goals.\n- **[Architecture](architecture.md)**: Architectural boundaries, components, and rules.\n- **[Tasks](tasks/)**: Active, completed, and blocked tasks.\n- **[Decisions](decisions/)**: Architecture Decision Records (ADRs).\n- **[Failures](failures/)**: Documented failed approaches (\"Do Not Repeat\").\n- **[Handovers](handovers/)**: Actionable work handovers between sessions.\n- **[Sessions](sessions/)**: Chronological records of developer & AI sessions.\n";
declare const DEFAULT_CONFIG_YML = "# Continuity Configuration\n\nversion: 1\n\ngit:\n  track:\n    - state.md\n    - project.md\n    - architecture.md\n    - roadmap.md\n    - index.md\n    - tasks/**\n    - decisions/**\n    - failures/**\n    - handovers/**\n    - sessions/summaries/**\n  ignore:\n    - sessions/raw/**\n    - cache/**\n    - \"*.tmp\"\n\nredaction:\n  enabled: true\n  files:\n    - .env\n    - .env.*\n    - \"*.pem\"\n    - \"*.key\"\n    - id_rsa\n    - credentials.json\n\nai:\n  instructionsFile: CONTINUITY.md\n";

declare const UNIVERSAL_SKILL_MD = "---\nname: continuity\ndescription: Read, update, and manage persistent project-context and work-state using the Continuity system.\n---\n\n# Continuity Universal Agent Skill\n\nYou are operating inside a codebase that uses **Continuity** for persistent project-context, task state, and cross-AI work continuation.\n\n## 1. When Resuming Work (Session Start)\nWhenever you start a session or are asked to work on a task:\n1. Run `continuity resume` in the terminal (or read `CONTINUITY.md` and `.continuity/state.md`).\n2. Review the output:\n   - **Current Task & Progress**\n   - **Remaining items**\n   - **Relevant files**\n   - **Failed Approaches (\"Do Not Repeat\")**\n   - **Recommended Next Action**\n3. Check `git status` to see if there are any uncommitted changes from prior work.\n4. Continue directly from the recommended next action without asking \"What should I work on?\".\n\n## 2. While Working\n- **Architectural decisions**: Respect existing decisions in `.continuity/decisions/`.\n- **New major decisions**: Record them using `continuity decision \"<title>\"` or `continuity log \"<message>\"`.\n- **Failures & Blockers**: If an implementation attempt fails, NEVER silently discard it. Record it with `continuity failure record` so subsequent agents will not repeat the mistake.\n- **Task updates**: As you make progress, update the task with `continuity task update`.\n\n## 3. When Concluding Work (Session End / Handover)\nBefore ending your work:\n1. Run `continuity handover` or `continuity done` to generate an actionable continuation package.\n2. Ensure the **Next Action** contains:\n   - Specific file path to open\n   - Exact function or block to focus on\n   - Clear problem description\n   - Expected technical solution\n   - Any constraints (e.g. \"Do not modify the auth architecture\")\n3. Save the session: `continuity session save`.\n";
declare const CURSOR_RULES_MDC = "---\ndescription: Continuity system integration for Cursor\nglobs: *\n---\n\n# Continuity Protocol for Cursor\n\nThis repository uses Continuity for persistent context across AI and human sessions.\n\n- Before starting work:\n  1. Inspect `.continuity/state.md` or run `continuity resume`.\n  2. Follow the recorded \"Next Action\".\n  3. Never repeat failed approaches listed in `.continuity/failures/`.\n\n- After making significant changes or completing tasks:\n  1. Update `.continuity/state.md` or run `continuity task update`.\n  2. If handing over, run `continuity handover`.\n";
declare const CLAUDE_CODE_SNIPPET = "# Continuity Protocol (Claude Code)\n\nThis repository uses the Continuity work-state system.\nBefore working on any task:\n1. Run `continuity resume` to load current project state, active task, and the exact next action.\n2. Respect existing Architecture Decision Records in `.continuity/decisions/`.\n3. Check `.continuity/failures/` to avoid previously failed approaches.\n4. When finished or handing over, run `continuity handover` and save session with `continuity session save`.\n";
declare const WINDSURF_RULES_SNIPPET = "# Continuity Rules for Windsurf\n- On task start: Run `continuity resume` and follow Next Action.\n- Do not repeat approaches documented in `.continuity/failures/`.\n- On completion: Run `continuity handover`.\n";
declare const CLINE_RULES_SNIPPET = "# Continuity Protocol for Cline / Roo-Code\nAlways check `.continuity/state.md` before beginning.\nResume context using `continuity resume`.\nRecord failed attempts into `.continuity/failures/`.\nGenerate handover on completion using `continuity handover`.\n";

export { CLAUDE_CODE_SNIPPET, CLINE_RULES_SNIPPET, CURSOR_RULES_MDC, type ContinuityConfig, ContinuityConfigSchema, type ContinuityState, ContinuityStateSchema, DEFAULT_ARCHITECTURE_MD, DEFAULT_CONFIG_YML, DEFAULT_CONTINUITY_MD, DEFAULT_INDEX_MD, DEFAULT_PROJECT_MD, DEFAULT_ROADMAP_MD, DEFAULT_STATE_MD, type Decision, DecisionManager, DecisionSchema, type DoctorCheck, DoctorEngine, type DoctorReport, ExplainEngine, type Failure, FailureManager, FailureSchema, type FileExplanation, FileSystem, GitClient, type GitCommitInfo, type GitStatusInfo, type Handover, HandoverManager, HandoverSchema, type IndexedDocument, MarkdownHelper, type NextAction, NextActionSchema, type ParsedMarkdown, type ProjectInfo, ProjectInfoSchema, type RawSession, type RedactionResult, type ResumeContext, ResumeEngine, SQLiteIndexer, type SearchResult, SecretRedactor, SessionManager, type SessionSummary, SessionSummarySchema, StateManager, type TaskItem, TaskItemSchema, TaskManager, type TaskStatus, TaskStatusSchema, UNIVERSAL_SKILL_MD, WINDSURF_RULES_SNIPPET };
