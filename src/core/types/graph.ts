export type EntityType =
  | 'plan'
  | 'task'
  | 'commit'
  | 'file'
  | 'session'
  | 'decision'
  | 'failure';

export interface EntityRelationship {
  sourceId: string;
  sourceType: EntityType;
  targetId: string;
  targetType: EntityType;
  relation: string; // e.g. 'implements', 'part_of', 'references', 'modifies', 'resolved_by'
  createdAt?: string;
}

export interface GraphNode {
  id: string;
  type: EntityType;
  title: string;
  metadata?: Record<string, any>;
}
