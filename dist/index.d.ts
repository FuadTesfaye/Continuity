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
    planId: z.ZodOptional<z.ZodString>;
    commits: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    acceptanceCriteria: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
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
    commits: string[];
    acceptanceCriteria: string[];
    createdAt: string;
    updatedAt: string;
    description?: string | undefined;
    planId?: string | undefined;
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
    planId?: string | undefined;
    commits?: string[] | undefined;
    acceptanceCriteria?: string[] | undefined;
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
    planId: z.ZodOptional<z.ZodString>;
    commitsCreated: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    stagedChanges: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    unstagedChanges: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
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
    commitsCreated: string[];
    stagedChanges: string[];
    unstagedChanges: string[];
    planId?: string | undefined;
    task?: string | undefined;
    nextStep?: string | undefined;
    importantContext?: string | undefined;
    gitCommit?: string | undefined;
}, {
    id: string;
    date: string;
    objective: string;
    planId?: string | undefined;
    agent?: string | undefined;
    branch?: string | undefined;
    task?: string | undefined;
    workCompleted?: string[] | undefined;
    filesChanged?: string[] | undefined;
    decisions?: string[] | undefined;
    failedApproaches?: string[] | undefined;
    problems?: string[] | undefined;
    commitsCreated?: string[] | undefined;
    stagedChanges?: string[] | undefined;
    unstagedChanges?: string[] | undefined;
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
    planId: z.ZodOptional<z.ZodString>;
    planStep: z.ZodOptional<z.ZodString>;
    commits: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
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
    commits: string[];
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
    planId?: string | undefined;
    commit?: string | undefined;
    currentTask?: string | undefined;
    planStep?: string | undefined;
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
    planId?: string | undefined;
    commits?: string[] | undefined;
    author?: string | undefined;
    decisions?: string[] | undefined;
    failedApproaches?: string[] | undefined;
    problems?: string[] | undefined;
    commit?: string | undefined;
    currentTask?: string | undefined;
    modifiedFiles?: string[] | undefined;
    uncommittedChanges?: boolean | undefined;
    planStep?: string | undefined;
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

declare const PlanStatusSchema: z.ZodEnum<["planned", "active", "blocked", "completed", "abandoned"]>;
type PlanStatus = z.infer<typeof PlanStatusSchema>;
declare const PlanStepSchema: z.ZodObject<{
    id: z.ZodString;
    description: z.ZodString;
    status: z.ZodDefault<z.ZodEnum<["pending", "in_progress", "completed", "blocked"]>>;
    commits: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    files: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    status: "completed" | "blocked" | "pending" | "in_progress";
    files: string[];
    id: string;
    description: string;
    commits: string[];
}, {
    id: string;
    description: string;
    status?: "completed" | "blocked" | "pending" | "in_progress" | undefined;
    files?: string[] | undefined;
    commits?: string[] | undefined;
}>;
type PlanStep = z.infer<typeof PlanStepSchema>;
declare const AcceptanceCriterionSchema: z.ZodObject<{
    id: z.ZodString;
    description: z.ZodString;
    satisfied: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    id: string;
    description: string;
    satisfied: boolean;
}, {
    id: string;
    description: string;
    satisfied?: boolean | undefined;
}>;
type AcceptanceCriterion = z.infer<typeof AcceptanceCriterionSchema>;
declare const PlanSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    status: z.ZodDefault<z.ZodEnum<["planned", "active", "blocked", "completed", "abandoned"]>>;
    goal: z.ZodString;
    scope: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    steps: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        description: z.ZodString;
        status: z.ZodDefault<z.ZodEnum<["pending", "in_progress", "completed", "blocked"]>>;
        commits: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        files: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        status: "completed" | "blocked" | "pending" | "in_progress";
        files: string[];
        id: string;
        description: string;
        commits: string[];
    }, {
        id: string;
        description: string;
        status?: "completed" | "blocked" | "pending" | "in_progress" | undefined;
        files?: string[] | undefined;
        commits?: string[] | undefined;
    }>, "many">>;
    constraints: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    dependencies: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    acceptanceCriteria: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        description: z.ZodString;
        satisfied: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        description: string;
        satisfied: boolean;
    }, {
        id: string;
        description: string;
        satisfied?: boolean | undefined;
    }>, "many">>;
    currentStep: z.ZodOptional<z.ZodString>;
    nextStep: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    completedAt: z.ZodOptional<z.ZodString>;
    abandonReason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "active" | "completed" | "blocked" | "planned" | "abandoned";
    id: string;
    title: string;
    acceptanceCriteria: {
        id: string;
        description: string;
        satisfied: boolean;
    }[];
    createdAt: string;
    updatedAt: string;
    constraints: string[];
    goal: string;
    scope: string[];
    steps: {
        status: "completed" | "blocked" | "pending" | "in_progress";
        files: string[];
        id: string;
        description: string;
        commits: string[];
    }[];
    dependencies: string[];
    completedAt?: string | undefined;
    nextStep?: string | undefined;
    currentStep?: string | undefined;
    abandonReason?: string | undefined;
}, {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    goal: string;
    status?: "active" | "completed" | "blocked" | "planned" | "abandoned" | undefined;
    acceptanceCriteria?: {
        id: string;
        description: string;
        satisfied?: boolean | undefined;
    }[] | undefined;
    completedAt?: string | undefined;
    nextStep?: string | undefined;
    constraints?: string[] | undefined;
    scope?: string[] | undefined;
    steps?: {
        id: string;
        description: string;
        status?: "completed" | "blocked" | "pending" | "in_progress" | undefined;
        files?: string[] | undefined;
        commits?: string[] | undefined;
    }[] | undefined;
    dependencies?: string[] | undefined;
    currentStep?: string | undefined;
    abandonReason?: string | undefined;
}>;
type Plan = z.infer<typeof PlanSchema>;

type ContextTier = 'HIGH' | 'MEDIUM' | 'FILTERED';
type ContextSourceType = 'code' | 'git' | 'state' | 'plan' | 'session' | 'decision' | 'failure';
interface ContextItem {
    id: string;
    source: ContextSourceType;
    title: string;
    summary: string;
    content: string;
    files: string[];
    commits: string[];
    date?: string;
    score: number;
    tier: ContextTier;
    reasons: string[];
}
interface RankedContextPayload {
    task: string;
    branch: string;
    commit?: string;
    highPriority: ContextItem[];
    mediumPriority: ContextItem[];
    totalScore: number;
    tokenEstimate: number;
}

type EntityType = 'plan' | 'task' | 'commit' | 'file' | 'session' | 'decision' | 'failure';
interface EntityRelationship {
    sourceId: string;
    sourceType: EntityType;
    targetId: string;
    targetType: EntityType;
    relation: string;
    createdAt?: string;
}
interface GraphNode {
    id: string;
    type: EntityType;
    title: string;
    metadata?: Record<string, any>;
}

declare const ProjectCategorySchema: z.ZodEnum<["personal", "client", "work", "open-source", "learning", "experimental", "archived"]>;
type ProjectCategory = z.infer<typeof ProjectCategorySchema>;
declare const ProjectRegistryItemSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    type: z.ZodDefault<z.ZodEnum<["personal", "client", "work", "open-source", "learning", "experimental", "archived"]>>;
    path: z.ZodString;
    client: z.ZodOptional<z.ZodString>;
    repository: z.ZodOptional<z.ZodObject<{
        provider: z.ZodDefault<z.ZodString>;
        accountProfile: z.ZodDefault<z.ZodString>;
        owner: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        url: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        provider: string;
        accountProfile: string;
        name?: string | undefined;
        owner?: string | undefined;
        url?: string | undefined;
    }, {
        name?: string | undefined;
        provider?: string | undefined;
        accountProfile?: string | undefined;
        owner?: string | undefined;
        url?: string | undefined;
    }>>;
    stack: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    continuityEnabled: z.ZodDefault<z.ZodBoolean>;
    lastAccessed: z.ZodString;
}, "strip", z.ZodTypeAny, {
    path: string;
    type: "personal" | "client" | "work" | "open-source" | "learning" | "experimental" | "archived";
    id: string;
    name: string;
    stack: string[];
    continuityEnabled: boolean;
    lastAccessed: string;
    repository?: {
        provider: string;
        accountProfile: string;
        name?: string | undefined;
        owner?: string | undefined;
        url?: string | undefined;
    } | undefined;
    client?: string | undefined;
}, {
    path: string;
    id: string;
    name: string;
    lastAccessed: string;
    type?: "personal" | "client" | "work" | "open-source" | "learning" | "experimental" | "archived" | undefined;
    stack?: string[] | undefined;
    repository?: {
        name?: string | undefined;
        provider?: string | undefined;
        accountProfile?: string | undefined;
        owner?: string | undefined;
        url?: string | undefined;
    } | undefined;
    client?: string | undefined;
    continuityEnabled?: boolean | undefined;
}>;
type ProjectRegistryItem = z.infer<typeof ProjectRegistryItemSchema>;
declare const ProjectRegistrySchema: z.ZodObject<{
    version: z.ZodDefault<z.ZodString>;
    updatedAt: z.ZodString;
    projects: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        type: z.ZodDefault<z.ZodEnum<["personal", "client", "work", "open-source", "learning", "experimental", "archived"]>>;
        path: z.ZodString;
        client: z.ZodOptional<z.ZodString>;
        repository: z.ZodOptional<z.ZodObject<{
            provider: z.ZodDefault<z.ZodString>;
            accountProfile: z.ZodDefault<z.ZodString>;
            owner: z.ZodOptional<z.ZodString>;
            name: z.ZodOptional<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            provider: string;
            accountProfile: string;
            name?: string | undefined;
            owner?: string | undefined;
            url?: string | undefined;
        }, {
            name?: string | undefined;
            provider?: string | undefined;
            accountProfile?: string | undefined;
            owner?: string | undefined;
            url?: string | undefined;
        }>>;
        stack: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        continuityEnabled: z.ZodDefault<z.ZodBoolean>;
        lastAccessed: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        path: string;
        type: "personal" | "client" | "work" | "open-source" | "learning" | "experimental" | "archived";
        id: string;
        name: string;
        stack: string[];
        continuityEnabled: boolean;
        lastAccessed: string;
        repository?: {
            provider: string;
            accountProfile: string;
            name?: string | undefined;
            owner?: string | undefined;
            url?: string | undefined;
        } | undefined;
        client?: string | undefined;
    }, {
        path: string;
        id: string;
        name: string;
        lastAccessed: string;
        type?: "personal" | "client" | "work" | "open-source" | "learning" | "experimental" | "archived" | undefined;
        stack?: string[] | undefined;
        repository?: {
            name?: string | undefined;
            provider?: string | undefined;
            accountProfile?: string | undefined;
            owner?: string | undefined;
            url?: string | undefined;
        } | undefined;
        client?: string | undefined;
        continuityEnabled?: boolean | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    version: string;
    updatedAt: string;
    projects: {
        path: string;
        type: "personal" | "client" | "work" | "open-source" | "learning" | "experimental" | "archived";
        id: string;
        name: string;
        stack: string[];
        continuityEnabled: boolean;
        lastAccessed: string;
        repository?: {
            provider: string;
            accountProfile: string;
            name?: string | undefined;
            owner?: string | undefined;
            url?: string | undefined;
        } | undefined;
        client?: string | undefined;
    }[];
}, {
    updatedAt: string;
    version?: string | undefined;
    projects?: {
        path: string;
        id: string;
        name: string;
        lastAccessed: string;
        type?: "personal" | "client" | "work" | "open-source" | "learning" | "experimental" | "archived" | undefined;
        stack?: string[] | undefined;
        repository?: {
            name?: string | undefined;
            provider?: string | undefined;
            accountProfile?: string | undefined;
            owner?: string | undefined;
            url?: string | undefined;
        } | undefined;
        client?: string | undefined;
        continuityEnabled?: boolean | undefined;
    }[] | undefined;
}>;
type ProjectRegistry = z.infer<typeof ProjectRegistrySchema>;
declare const DeviceEnvironmentSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    hostname: z.ZodString;
    os: z.ZodObject<{
        name: z.ZodString;
        platform: z.ZodString;
        release: z.ZodString;
        arch: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        platform: string;
        release: string;
        arch: string;
    }, {
        name: string;
        platform: string;
        release: string;
        arch: string;
    }>;
    runtimes: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
    tools: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodString>>;
    shell: z.ZodOptional<z.ZodString>;
    defaultEditor: z.ZodOptional<z.ZodString>;
    packageManager: z.ZodDefault<z.ZodString>;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    updatedAt: string;
    name: string;
    hostname: string;
    os: {
        name: string;
        platform: string;
        release: string;
        arch: string;
    };
    runtimes: Record<string, string>;
    tools: Record<string, string>;
    packageManager: string;
    shell?: string | undefined;
    defaultEditor?: string | undefined;
}, {
    id: string;
    updatedAt: string;
    name: string;
    hostname: string;
    os: {
        name: string;
        platform: string;
        release: string;
        arch: string;
    };
    runtimes?: Record<string, string> | undefined;
    tools?: Record<string, string> | undefined;
    shell?: string | undefined;
    defaultEditor?: string | undefined;
    packageManager?: string | undefined;
}>;
type DeviceEnvironment = z.infer<typeof DeviceEnvironmentSchema>;
declare const AccountProfileSchema: z.ZodObject<{
    provider: z.ZodString;
    profile: z.ZodString;
    username: z.ZodString;
    email: z.ZodOptional<z.ZodString>;
    credentialRef: z.ZodString;
    status: z.ZodDefault<z.ZodEnum<["authenticated", "unauthenticated", "unknown"]>>;
    scopes: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    updatedAt: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "unknown" | "authenticated" | "unauthenticated";
    updatedAt: string;
    provider: string;
    profile: string;
    username: string;
    credentialRef: string;
    scopes: string[];
    email?: string | undefined;
}, {
    provider: string;
    profile: string;
    username: string;
    credentialRef: string;
    status?: "unknown" | "authenticated" | "unauthenticated" | undefined;
    updatedAt?: string | undefined;
    email?: string | undefined;
    scopes?: string[] | undefined;
}>;
type AccountProfile = z.infer<typeof AccountProfileSchema>;
declare const AccountRegistrySchema: z.ZodObject<{
    version: z.ZodDefault<z.ZodString>;
    updatedAt: z.ZodString;
    accounts: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodRecord<z.ZodString, z.ZodObject<{
        provider: z.ZodString;
        profile: z.ZodString;
        username: z.ZodString;
        email: z.ZodOptional<z.ZodString>;
        credentialRef: z.ZodString;
        status: z.ZodDefault<z.ZodEnum<["authenticated", "unauthenticated", "unknown"]>>;
        scopes: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        updatedAt: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        status: "unknown" | "authenticated" | "unauthenticated";
        updatedAt: string;
        provider: string;
        profile: string;
        username: string;
        credentialRef: string;
        scopes: string[];
        email?: string | undefined;
    }, {
        provider: string;
        profile: string;
        username: string;
        credentialRef: string;
        status?: "unknown" | "authenticated" | "unauthenticated" | undefined;
        updatedAt?: string | undefined;
        email?: string | undefined;
        scopes?: string[] | undefined;
    }>>>>;
}, "strip", z.ZodTypeAny, {
    version: string;
    updatedAt: string;
    accounts: Record<string, Record<string, {
        status: "unknown" | "authenticated" | "unauthenticated";
        updatedAt: string;
        provider: string;
        profile: string;
        username: string;
        credentialRef: string;
        scopes: string[];
        email?: string | undefined;
    }>>;
}, {
    updatedAt: string;
    version?: string | undefined;
    accounts?: Record<string, Record<string, {
        provider: string;
        profile: string;
        username: string;
        credentialRef: string;
        status?: "unknown" | "authenticated" | "unauthenticated" | undefined;
        updatedAt?: string | undefined;
        email?: string | undefined;
        scopes?: string[] | undefined;
    }>> | undefined;
}>;
type AccountRegistry = z.infer<typeof AccountRegistrySchema>;
declare const DeveloperProfileSchema: z.ZodObject<{
    name: z.ZodDefault<z.ZodString>;
    title: z.ZodOptional<z.ZodString>;
    primaryLanguages: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    preferredStack: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    preferredPackageManager: z.ZodDefault<z.ZodString>;
    preferredArchitecture: z.ZodDefault<z.ZodString>;
    uiPreferences: z.ZodDefault<z.ZodString>;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    updatedAt: string;
    name: string;
    primaryLanguages: string[];
    preferredStack: string[];
    preferredPackageManager: string;
    preferredArchitecture: string;
    uiPreferences: string;
    title?: string | undefined;
}, {
    updatedAt: string;
    title?: string | undefined;
    name?: string | undefined;
    primaryLanguages?: string[] | undefined;
    preferredStack?: string[] | undefined;
    preferredPackageManager?: string | undefined;
    preferredArchitecture?: string | undefined;
    uiPreferences?: string | undefined;
}>;
type DeveloperProfile = z.infer<typeof DeveloperProfileSchema>;
declare const ContextScopeSchema: z.ZodEnum<["task", "project", "developer", "global"]>;
type ContextScope = z.infer<typeof ContextScopeSchema>;
interface EffectiveToolchain {
    runtime: {
        name: string;
        version: string;
        source: 'task' | 'project' | 'global' | 'detected';
    };
    packageManager: {
        name: string;
        version?: string;
        source: 'task' | 'project' | 'global' | 'detected';
    };
    tools: Array<{
        name: string;
        version?: string;
        source: 'project' | 'global' | 'detected';
    }>;
}
interface EnvironmentDrift {
    tool: string;
    storedVersion: string;
    currentVersion: string;
    driftDetected: boolean;
}

interface GitCommitInfo {
    hash: string;
    shortHash: string;
    message: string;
    author: string;
    date: string;
    filesChanged?: string[];
}
interface GitStatusInfo {
    isGitRepo: boolean;
    branch: string;
    commit?: GitCommitInfo;
    modifiedFiles: string[];
    stagedFiles: string[];
    untrackedFiles: string[];
    hasUncommittedChanges: boolean;
    stats?: {
        filesChanged: number;
        insertions: number;
        deletions: number;
    };
}
interface GitTagInfo {
    name: string;
    commit: string;
    date: string;
    message?: string;
}
interface GitBlameLine {
    lineNum: number;
    commit: string;
    author: string;
    date: string;
    content: string;
}
interface ModuleEvolution {
    modulePath: string;
    totalCommits: number;
    releases: Array<{
        tag: string;
        date: string;
        commits: GitCommitInfo[];
    }>;
    recentCommits: GitCommitInfo[];
}
declare class GitClient {
    private readonly cwd;
    constructor(cwd?: string);
    private runGit;
    isGitRepository(): Promise<boolean>;
    getCurrentBranch(): Promise<string>;
    getLatestCommit(): Promise<GitCommitInfo | undefined>;
    getStatus(): Promise<GitStatusInfo>;
    getRecentCommits(limit?: number, filterPath?: string): Promise<GitCommitInfo[]>;
    getFileCommits(filePath: string, limit?: number): Promise<GitCommitInfo[]>;
    searchSymbolHistory(symbol: string, filterPath?: string, limit?: number): Promise<GitCommitInfo[]>;
    searchRegexHistory(regexPattern: string, filterPath?: string, limit?: number): Promise<GitCommitInfo[]>;
    getFileBlame(filePath: string, lineStart?: number, lineEnd?: number): Promise<GitBlameLine[]>;
    getCommitDetails(hash: string): Promise<{
        info: GitCommitInfo;
        stat: string;
    } | undefined>;
    getTags(): Promise<GitTagInfo[]>;
    getModuleEvolution(modulePath: string): Promise<ModuleEvolution>;
    getDiff(cached?: boolean): Promise<string>;
    getContextDiff(files?: string[], limitLines?: number): Promise<string>;
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
    private inMemoryFallbackRels;
    constructor(fs: FileSystem);
    init(): Promise<void>;
    private setupTables;
    determineType(relativePath: string): string;
    extractTitle(content: string, fallback: string): string;
    indexFile(filePath: string): Promise<void>;
    recordRelationship(rel: EntityRelationship): void;
    getRelatedEntities(entityId: string, entityType: EntityType): Array<{
        id: string;
        type: EntityType;
        relation: string;
    }>;
    reindexAll(): Promise<number>;
    search(query: string, options?: {
        type?: string;
        limit?: number;
    }): SearchResult[];
    private fallbackSearch;
    close(): void;
}

declare class StateManager {
    readonly fs: FileSystem;
    constructor(fs: FileSystem);
    getState(): Promise<ContinuityState>;
    saveState(state: Partial<ContinuityState>): Promise<ContinuityState>;
    getProjectInfo(): Promise<ProjectInfo>;
    saveProjectInfo(info: Partial<ProjectInfo>): Promise<ProjectInfo>;
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
        planId?: string;
        acceptanceCriteria?: string[];
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
        commitsCreated?: string[];
        stagedChanges?: string[];
        unstagedChanges?: string[];
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
        planId?: string;
        planStep?: string;
        commits?: string[];
        nextAction: NextAction;
        author?: string;
    }): Promise<Handover>;
    getLatestHandover(): Promise<Handover | undefined>;
    private formatHandoverMarkdown;
    private parseHandoverMarkdown;
}

declare class PlanManager {
    private readonly fs;
    constructor(fs: FileSystem);
    private get plansDir();
    private slugify;
    private getPlanDir;
    createPlan(data: {
        title: string;
        goal: string;
        scope?: string[];
        steps: Array<{
            description: string;
            files?: string[];
        } | string>;
        constraints?: string[];
        dependencies?: string[];
        acceptanceCriteria?: string[];
    }): Promise<Plan>;
    getPlan(id: string): Promise<Plan | undefined>;
    getActivePlan(): Promise<Plan | undefined>;
    updatePlan(id: string, updates: {
        status?: PlanStatus;
        currentStep?: string;
        completeStepIndex?: number;
        addCommitsToStep?: {
            stepIndex: number;
            commits: string[];
        };
        satisfyCriterionIndex?: number;
        abandonReason?: string;
    }): Promise<Plan>;
    completePlan(id: string): Promise<Plan>;
    blockPlan(id: string, reason: string): Promise<Plan>;
    abandonPlan(id: string, reason: string): Promise<Plan>;
    listPlans(): Promise<{
        active: Plan[];
        blocked: Plan[];
        completed: Plan[];
        abandoned: Plan[];
    }>;
    private savePlanFile;
    private formatPlanMarkdown;
    private parsePlanMarkdown;
}

declare class GlobalFileSystem {
    readonly globalDir: string;
    constructor(customGlobalDir?: string);
    resolve(...subpaths: string[]): string;
    exists(filePath?: string): boolean;
    isInitialized(): boolean;
    ensureDir(dirPath: string): Promise<void>;
    readFile(filePath: string): Promise<string>;
    writeFile(filePath: string, content: string): Promise<void>;
    readYaml<T>(filePath: string): Promise<T | undefined>;
    writeYaml<T>(filePath: string, data: T): Promise<void>;
    listFiles(dirPath: string, extension?: string): Promise<string[]>;
    initGlobalStructure(): Promise<void>;
}

interface ResumeContext {
    scope: ContextScope;
    project: string;
    category?: string;
    purpose: string;
    architectureSummary: string;
    developer?: {
        name: string;
        preferences?: string;
    };
    environment?: {
        os: string;
        runtime: string;
        packageManager: string;
    };
    accountMetadata?: {
        provider: string;
        profile: string;
        username: string;
    };
    branch: string;
    commit?: string;
    currentTask: string;
    progress: number;
    plan?: {
        id: string;
        title: string;
        status: string;
        goal: string;
        currentStep?: string;
        nextStep?: string;
        progressPercentage: number;
        steps: Array<{
            id: string;
            description: string;
            status: string;
        }>;
        constraints: string[];
    };
    completed: string[];
    remaining: string[];
    currentBlocker?: string | null;
    relevantFiles: string[];
    recentCommits: GitCommitInfo[];
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
    uncommittedStats?: {
        filesChanged: number;
        insertions: number;
        deletions: number;
    };
}
declare class ResumeEngine {
    private readonly stateManager;
    private readonly handoverManager;
    private readonly sessionManager;
    private readonly failureManager;
    private readonly decisionManager;
    private readonly git;
    private readonly planManager?;
    private readonly globalFs?;
    constructor(stateManager: StateManager, handoverManager: HandoverManager, sessionManager: SessionManager, failureManager: FailureManager, decisionManager: DecisionManager, git: GitClient, planManager?: PlanManager | undefined, globalFs?: GlobalFileSystem | undefined);
    buildContext(options?: {
        scope?: ContextScope;
    }): Promise<ResumeContext>;
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
    private readonly globalFs?;
    private redactor;
    constructor(fs: FileSystem, git: GitClient, stateManager: StateManager, taskManager: TaskManager, globalFs?: GlobalFileSystem | undefined);
    runDiagnostics(): Promise<DoctorReport>;
}

interface ContextCandidates {
    task?: TaskItem;
    plan?: Plan;
    currentFiles: string[];
    recentCommits: GitCommitInfo[];
    sessions: SessionSummary[];
    decisions: Decision[];
    failures: Failure[];
    uncommittedDiff?: string;
    branch: string;
    headCommit?: string;
}
declare class ContextRanker {
    rank(candidates: ContextCandidates): RankedContextPayload;
    formatPrompt(ranked: RankedContextPayload, uncommittedDiff?: string): string;
}

interface VerificationReport {
    plan?: Plan;
    status: 'READY_FOR_HANDOVER' | 'IN_PROGRESS' | 'BLOCKED';
    stepsTotal: number;
    stepsCompleted: number;
    criteriaTotal: number;
    criteriaSatisfied: number;
    uncommittedFilesCount: number;
    testsPassed?: boolean;
    testOutput?: string;
    checks: Array<{
        name: string;
        passed: boolean;
        message: string;
        warning?: boolean;
    }>;
    nextRecommendedAction: string;
}
declare class VerificationEngine {
    private readonly planManager;
    private readonly git;
    private readonly fs;
    constructor(planManager: PlanManager, git: GitClient, fs: FileSystem);
    verify(planId?: string, runTests?: boolean): Promise<VerificationReport>;
}

declare class DeviceDetector {
    private readonly gfs;
    constructor(gfs: GlobalFileSystem);
    private runCommand;
    private getPrettyOsName;
    probeEnvironment(): Promise<DeviceEnvironment>;
    getStoredEnvironment(deviceId?: string): Promise<DeviceEnvironment | undefined>;
    syncEnvironment(deviceId?: string): Promise<DeviceEnvironment>;
    detectDrift(deviceId?: string): Promise<EnvironmentDrift[]>;
}

declare class ToolchainManager {
    private readonly gfs;
    private readonly projectFs?;
    private readonly detector?;
    constructor(gfs: GlobalFileSystem, projectFs?: FileSystem | undefined, detector?: DeviceDetector | undefined);
    resolveEffectiveToolchain(taskOverride?: {
        nodeVersion?: string;
        packageManager?: string;
    }): Promise<EffectiveToolchain>;
}

declare class ProjectRegistryManager {
    private readonly gfs;
    constructor(gfs: GlobalFileSystem);
    private get registryFile();
    getRegistry(): Promise<ProjectRegistry>;
    private saveRegistry;
    listProjects(category?: ProjectCategory): Promise<ProjectRegistryItem[]>;
    getProject(idOrPath: string): Promise<ProjectRegistryItem | undefined>;
    registerProject(data: {
        path: string;
        name?: string;
        type?: ProjectCategory;
        client?: string;
        repository?: ProjectRegistryItem['repository'];
        stack?: string[];
    }): Promise<ProjectRegistryItem>;
    classifyProject(idOrPath: string, type: ProjectCategory, clientName?: string): Promise<ProjectRegistryItem>;
    touchProject(idOrPath: string): Promise<void>;
    validateClientIsolation(activeProject: ProjectRegistryItem | undefined, targetProject: ProjectRegistryItem | undefined): boolean;
}

declare class AccountManager {
    private readonly gfs;
    constructor(gfs: GlobalFileSystem);
    private get accountsFile();
    getRegistry(): Promise<AccountRegistry>;
    listAccounts(provider?: string): Promise<AccountProfile[]>;
    getAccount(provider: string, profile: string): Promise<AccountProfile | undefined>;
    setAccountProfile(profile: AccountProfile): Promise<AccountProfile>;
    getAiSafeMetadata(profile: AccountProfile): {
        provider: string;
        profile: string;
        username: string;
        status: string;
    };
}

interface KnowledgeArticle {
    category: string;
    name: string;
    path: string;
    content: string;
    title: string;
}
declare class KnowledgeManager {
    private readonly gfs;
    constructor(gfs: GlobalFileSystem);
    private get knowledgeDir();
    private get historyDir();
    listArticles(category?: string): Promise<KnowledgeArticle[]>;
    saveArticle(category: string, name: string, content: string): Promise<string>;
    getArticle(category: string, name: string): Promise<KnowledgeArticle | undefined>;
}

interface BootstrapCheck {
    tool: string;
    required?: string;
    installed?: string;
    satisfied: boolean;
    recommendation?: string;
}
interface BootstrapReport {
    projectName: string;
    checks: BootstrapCheck[];
    missingCount: number;
    allSatisfied: boolean;
}
declare class BootstrapEngine {
    private readonly fs;
    private readonly gfs;
    constructor(fs: FileSystem, gfs: GlobalFileSystem);
    checkEnvironment(): Promise<BootstrapReport>;
    generateConfig(type: 'mise' | 'nvm' | 'tool-versions'): Promise<{
        path: string;
        content: string;
    }>;
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

export { type AcceptanceCriterion, AcceptanceCriterionSchema, AccountManager, type AccountProfile, AccountProfileSchema, type AccountRegistry, AccountRegistrySchema, type BootstrapCheck, BootstrapEngine, type BootstrapReport, CLAUDE_CODE_SNIPPET, CLINE_RULES_SNIPPET, CURSOR_RULES_MDC, type ContextCandidates, type ContextItem, ContextRanker, type ContextScope, ContextScopeSchema, type ContextSourceType, type ContextTier, type ContinuityConfig, ContinuityConfigSchema, type ContinuityState, ContinuityStateSchema, DEFAULT_ARCHITECTURE_MD, DEFAULT_CONFIG_YML, DEFAULT_CONTINUITY_MD, DEFAULT_INDEX_MD, DEFAULT_PROJECT_MD, DEFAULT_ROADMAP_MD, DEFAULT_STATE_MD, type Decision, DecisionManager, DecisionSchema, type DeveloperProfile, DeveloperProfileSchema, DeviceDetector, type DeviceEnvironment, DeviceEnvironmentSchema, type DoctorCheck, DoctorEngine, type DoctorReport, type EffectiveToolchain, type EntityRelationship, type EntityType, type EnvironmentDrift, ExplainEngine, type Failure, FailureManager, FailureSchema, type FileExplanation, FileSystem, type GitBlameLine, GitClient, type GitCommitInfo, type GitStatusInfo, type GitTagInfo, GlobalFileSystem, type GraphNode, type Handover, HandoverManager, HandoverSchema, type IndexedDocument, type KnowledgeArticle, KnowledgeManager, MarkdownHelper, type ModuleEvolution, type NextAction, NextActionSchema, type ParsedMarkdown, type Plan, PlanManager, PlanSchema, type PlanStatus, PlanStatusSchema, type PlanStep, PlanStepSchema, type ProjectCategory, ProjectCategorySchema, type ProjectInfo, ProjectInfoSchema, type ProjectRegistry, type ProjectRegistryItem, ProjectRegistryItemSchema, ProjectRegistryManager, ProjectRegistrySchema, type RankedContextPayload, type RawSession, type RedactionResult, type ResumeContext, ResumeEngine, SQLiteIndexer, type SearchResult, SecretRedactor, SessionManager, type SessionSummary, SessionSummarySchema, StateManager, type TaskItem, TaskItemSchema, TaskManager, type TaskStatus, TaskStatusSchema, ToolchainManager, UNIVERSAL_SKILL_MD, VerificationEngine, type VerificationReport, WINDSURF_RULES_SNIPPET };
