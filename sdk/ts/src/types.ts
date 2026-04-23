export type CompletionMode =
  | "accepted_only"
  | "readback_confirmed"
  | "observed_effect";

export type ExecutionEventType =
  | "requested"
  | "acknowledged"
  | "completed"
  | "failed"
  | "evidence_recorded";

export interface CapabilityDescriptor {
  id: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  evidenceModes?: string[];
  completionMode?: CompletionMode;
  idempotent?: boolean;
}

export interface ExecutionRequest {
  executionId: string;
  capabilityId: string;
  input: Record<string, unknown>;
  idempotencyKey: string;
  requestedAt: string;
  contextRef?: string;
  deadlineAt?: string;
  requestedBy?: string;
  evidencePolicy?: Record<string, unknown>;
}

export interface ExecutionEvent {
  eventId: string;
  executionId: string;
  type: ExecutionEventType;
  at: string;
  summary?: string;
  metadata?: Record<string, unknown>;
  evidenceIds?: string[];
}

export interface EvidenceRecord {
  evidenceId: string;
  executionId: string;
  kind: string;
  recordedAt: string;
  summary?: string;
  data?: Record<string, unknown>;
  sourceRef?: string;
}

export interface ExecutionTrace {
  capability: CapabilityDescriptor;
  requests: ExecutionRequest[];
  events: ExecutionEvent[];
  evidence: EvidenceRecord[];
}

export interface ConformanceIssue {
  code: string;
  message: string;
  path: string;
}

export interface ConformanceResult {
  ok: boolean;
  issues: ConformanceIssue[];
}
