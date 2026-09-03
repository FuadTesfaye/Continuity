import { z } from 'zod';

export const ProjectCategorySchema = z.enum([
  'personal',
  'client',
  'work',
  'open-source',
  'learning',
  'experimental',
  'archived'
]);
export type ProjectCategory = z.infer<typeof ProjectCategorySchema>;

export const ProjectRegistryItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: ProjectCategorySchema.default('personal'),
  path: z.string(),
  client: z.string().optional(),
  repository: z
    .object({
      provider: z.string().default('github'),
      accountProfile: z.string().default('personal'),
      owner: z.string().optional(),
      name: z.string().optional(),
      url: z.string().optional()
    })
    .optional(),
  stack: z.array(z.string()).default([]),
  continuityEnabled: z.boolean().default(true),
  lastAccessed: z.string()
});
export type ProjectRegistryItem = z.infer<typeof ProjectRegistryItemSchema>;

export const ProjectRegistrySchema = z.object({
  version: z.string().default('1.0'),
  updatedAt: z.string(),
  projects: z.array(ProjectRegistryItemSchema).default([])
});
export type ProjectRegistry = z.infer<typeof ProjectRegistrySchema>;

export const DeviceEnvironmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  hostname: z.string(),
  os: z.object({
    name: z.string(),
    platform: z.string(),
    release: z.string(),
    arch: z.string()
  }),
  runtimes: z.record(z.string(), z.string()).default({}),
  tools: z.record(z.string(), z.string()).default({}),
  shell: z.string().optional(),
  defaultEditor: z.string().optional(),
  packageManager: z.string().default('pnpm'),
  updatedAt: z.string()
});
export type DeviceEnvironment = z.infer<typeof DeviceEnvironmentSchema>;

export const AccountProfileSchema = z.object({
  provider: z.string(), // e.g. github, npm, docker, aws
  profile: z.string(),  // e.g. personal, work, client-acme
  username: z.string(),
  email: z.string().optional(),
  credentialRef: z.string(), // e.g. keychain://github/personal
  status: z.enum(['authenticated', 'unauthenticated', 'unknown']).default('authenticated'),
  scopes: z.array(z.string()).default([]),
  updatedAt: z.string().default(() => new Date().toISOString())
});
export type AccountProfile = z.infer<typeof AccountProfileSchema>;

export const AccountRegistrySchema = z.object({
  version: z.string().default('1.0'),
  updatedAt: z.string(),
  accounts: z.record(z.string(), z.record(z.string(), AccountProfileSchema)).default({})
});
export type AccountRegistry = z.infer<typeof AccountRegistrySchema>;

export const DeveloperProfileSchema = z.object({
  name: z.string().default('Developer'),
  title: z.string().optional(),
  primaryLanguages: z.array(z.string()).default([]),
  preferredStack: z.array(z.string()).default([]),
  preferredPackageManager: z.string().default('pnpm'),
  preferredArchitecture: z.string().default('Clean Architecture'),
  uiPreferences: z.string().default('Minimal, accessible, responsive'),
  updatedAt: z.string()
});
export type DeveloperProfile = z.infer<typeof DeveloperProfileSchema>;

export const ContextScopeSchema = z.enum(['task', 'project', 'developer', 'global']);
export type ContextScope = z.infer<typeof ContextScopeSchema>;

export interface EffectiveToolchain {
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

export interface EnvironmentDrift {
  tool: string;
  storedVersion: string;
  currentVersion: string;
  driftDetected: boolean;
}
