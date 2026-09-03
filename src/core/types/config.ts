import { z } from 'zod';

export const ContinuityConfigSchema = z.object({
  version: z.number().default(1),
  git: z.object({
    track: z.array(z.string()).default([
      'state.md',
      'project.md',
      'architecture.md',
      'roadmap.md',
      'index.md',
      'tasks/**',
      'decisions/**',
      'failures/**',
      'handovers/**',
      'sessions/summaries/**'
    ]),
    ignore: z.array(z.string()).default([
      'sessions/raw/**',
      'cache/**',
      '*.tmp'
    ])
  }).default({
    track: [
      'state.md',
      'project.md',
      'architecture.md',
      'roadmap.md',
      'index.md',
      'tasks/**',
      'decisions/**',
      'failures/**',
      'handovers/**',
      'sessions/summaries/**'
    ],
    ignore: ['sessions/raw/**', 'cache/**', '*.tmp']
  }),
  redaction: z.object({
    enabled: z.boolean().default(true),
    files: z.array(z.string()).default([
      '.env',
      '.env.*',
      '*.pem',
      '*.key',
      'id_rsa',
      'id_ed25519',
      'credentials.json'
    ]),
    patterns: z.array(z.string()).default([
      '(?i)(api[_-]?key|secret|token|password|auth[_-]?token)\\s*[:=]\\s*["\']?([a-zA-Z0-9_\\-\\.~]{8,})["\']?',
      'gh[pous]_[a-zA-Z0-9]{36}',
      'sk-[a-zA-Z0-9_-]{20,}',
      'AIzaSy[a-zA-Z0-9_-]{33}',
      'bearer\\s+[a-zA-Z0-9_\\-\\.~]{20,}'
    ])
  }).default({
    enabled: true,
    files: [
      '.env',
      '.env.*',
      '*.pem',
      '*.key',
      'id_rsa',
      'id_ed25519',
      'credentials.json'
    ],
    patterns: [
      '(?i)(api[_-]?key|secret|token|password|auth[_-]?token)\\s*[:=]\\s*["\']?([a-zA-Z0-9_\\-\\.~]{8,})["\']?',
      'gh[pous]_[a-zA-Z0-9]{36}',
      'sk-[a-zA-Z0-9_-]{20,}',
      'AIzaSy[a-zA-Z0-9_-]{33}',
      'bearer\\s+[a-zA-Z0-9_\\-\\.~]{20,}'
    ]
  }),
  ai: z.object({
    defaultModel: z.string().optional(),
    instructionsFile: z.string().default('CONTINUITY.md')
  }).default({
    instructionsFile: 'CONTINUITY.md'
  })
});

export type ContinuityConfig = z.infer<typeof ContinuityConfigSchema>;
