import type {
  CapabilityDescriptor,
  CompletionMode,
  ConformanceIssue,
  ConformanceResult,
  EvidenceRecord,
  ExecutionEvent,
  ExecutionEventType,
  ExecutionRequest,
  ExecutionTrace,
} from "./types.js";

const COMPLETION_MODES: CompletionMode[] = [
  "accepted_only",
  "readback_confirmed",
  "observed_effect",
];

const EVENT_TYPES: ExecutionEventType[] = [
  "requested",
  "acknowledged",
  "completed",
  "failed",
  "evidence_recorded",
];

const TERMINAL_EVENT_TYPES = new Set<ExecutionEventType>(["completed", "failed"]);

function issue(code: string, message: string, path: string): ConformanceIssue {
  return { code, message, path };
}

function result(issues: ConformanceIssue[]): ConformanceResult {
  return {
    ok: issues.length === 0,
    issues,
  };
}

export class ConformanceError extends Error {
  issues: ConformanceIssue[];

  constructor(issues: ConformanceIssue[], message = formatConformanceIssues(issues)) {
    super(message);
    this.name = "ConformanceError";
    this.issues = issues;
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isDateTimeString(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp);
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  if (isPlainObject(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function validatePlainObjectField(
  issues: ConformanceIssue[],
  value: unknown,
  path: string,
  label: string,
): value is Record<string, unknown> {
  if (!isPlainObject(value)) {
    issues.push(issue("schema_validation_failed", `${label} must be an object`, path));
    return false;
  }

  return true;
}

function validateStringField(
  issues: ConformanceIssue[],
  value: unknown,
  path: string,
  label: string,
  options: {
    nonEmpty?: boolean;
    required?: boolean;
    dateTime?: boolean;
  } = {},
): boolean {
  const {
    required = true,
    nonEmpty = true,
    dateTime = false,
  } = options;

  if (value === undefined) {
    if (required) {
      issues.push(issue("schema_validation_failed", `${label} is required`, path));
    }
    return !required;
  }

  if (dateTime) {
    if (!isDateTimeString(value)) {
      issues.push(issue("schema_validation_failed", `${label} must be a date-time string`, path));
      return false;
    }
    return true;
  }

  if (nonEmpty ? !isNonEmptyString(value) : typeof value !== "string") {
    issues.push(issue("schema_validation_failed", `${label} must be a string`, path));
    return false;
  }

  return true;
}

function validateOptionalBooleanField(
  issues: ConformanceIssue[],
  value: unknown,
  path: string,
  label: string,
): void {
  if (value !== undefined && typeof value !== "boolean") {
    issues.push(issue("schema_validation_failed", `${label} must be a boolean`, path));
  }
}

function validateOptionalObjectField(
  issues: ConformanceIssue[],
  value: unknown,
  path: string,
  label: string,
): void {
  if (value !== undefined && !isPlainObject(value)) {
    issues.push(issue("schema_validation_failed", `${label} must be an object`, path));
  }
}

function validateOptionalStringArrayField(
  issues: ConformanceIssue[],
  value: unknown,
  path: string,
  label: string,
): void {
  if (value === undefined) return;
  if (!Array.isArray(value) || value.some((item) => !isNonEmptyString(item))) {
    issues.push(
      issue("schema_validation_failed", `${label} must be an array of non-empty strings`, path),
    );
  }
}

export function formatConformanceIssues(issues: ConformanceIssue[]): string {
  if (issues.length === 0) {
    return "EEAP conformance issues (0): none";
  }

  const lines = issues.map(
    (item, index) => `${index + 1}. ${item.code} at ${item.path}: ${item.message}`,
  );

  return [`EEAP conformance issues (${issues.length}):`, ...lines].join("\n");
}

export function validateCapabilityDescriptor(candidate: unknown): ConformanceResult {
  const issues: ConformanceIssue[] = [];
  if (!validatePlainObjectField(issues, candidate, "/", "CapabilityDescriptor")) {
    return result(issues);
  }

  validateStringField(issues, candidate.id, "/id", "CapabilityDescriptor.id");
  validateStringField(issues, candidate.title, "/title", "CapabilityDescriptor.title");
  validateStringField(
    issues,
    candidate.description,
    "/description",
    "CapabilityDescriptor.description",
  );
  validatePlainObjectField(issues, candidate.inputSchema, "/inputSchema", "CapabilityDescriptor.inputSchema");
  validateOptionalObjectField(issues, candidate.outputSchema, "/outputSchema", "CapabilityDescriptor.outputSchema");
  validateOptionalStringArrayField(
    issues,
    candidate.evidenceModes,
    "/evidenceModes",
    "CapabilityDescriptor.evidenceModes",
  );
  if (
    candidate.completionMode !== undefined &&
    !COMPLETION_MODES.includes(candidate.completionMode as CompletionMode)
  ) {
    issues.push(
      issue(
        "schema_validation_failed",
        "CapabilityDescriptor.completionMode must be a supported completion mode",
        "/completionMode",
      ),
    );
  }
  validateOptionalBooleanField(issues, candidate.idempotent, "/idempotent", "CapabilityDescriptor.idempotent");

  return result(issues);
}

export function validateExecutionRequest(candidate: unknown): ConformanceResult {
  const issues: ConformanceIssue[] = [];
  if (!validatePlainObjectField(issues, candidate, "/", "ExecutionRequest")) {
    return result(issues);
  }

  validateStringField(issues, candidate.executionId, "/executionId", "ExecutionRequest.executionId");
  validateStringField(issues, candidate.capabilityId, "/capabilityId", "ExecutionRequest.capabilityId");
  validatePlainObjectField(issues, candidate.input, "/input", "ExecutionRequest.input");
  validateStringField(issues, candidate.idempotencyKey, "/idempotencyKey", "ExecutionRequest.idempotencyKey");
  validateStringField(
    issues,
    candidate.requestedAt,
    "/requestedAt",
    "ExecutionRequest.requestedAt",
    { dateTime: true },
  );
  validateStringField(issues, candidate.contextRef, "/contextRef", "ExecutionRequest.contextRef", {
    required: false,
  });
  validateStringField(issues, candidate.deadlineAt, "/deadlineAt", "ExecutionRequest.deadlineAt", {
    required: false,
    dateTime: true,
  });
  validateStringField(issues, candidate.requestedBy, "/requestedBy", "ExecutionRequest.requestedBy", {
    required: false,
  });
  validateOptionalObjectField(
    issues,
    candidate.evidencePolicy,
    "/evidencePolicy",
    "ExecutionRequest.evidencePolicy",
  );

  return result(issues);
}

export function validateExecutionEvent(candidate: unknown): ConformanceResult {
  const issues: ConformanceIssue[] = [];
  if (!validatePlainObjectField(issues, candidate, "/", "ExecutionEvent")) {
    return result(issues);
  }

  validateStringField(issues, candidate.eventId, "/eventId", "ExecutionEvent.eventId");
  validateStringField(issues, candidate.executionId, "/executionId", "ExecutionEvent.executionId");
  if (
    !isNonEmptyString(candidate.type) ||
    !EVENT_TYPES.includes(candidate.type as ExecutionEventType)
  ) {
    issues.push(
      issue(
        "schema_validation_failed",
        "ExecutionEvent.type must be a supported lifecycle event",
        "/type",
      ),
    );
  }
  validateStringField(issues, candidate.at, "/at", "ExecutionEvent.at", { dateTime: true });
  validateStringField(issues, candidate.summary, "/summary", "ExecutionEvent.summary", {
    required: false,
  });
  validateOptionalObjectField(issues, candidate.metadata, "/metadata", "ExecutionEvent.metadata");
  validateOptionalStringArrayField(
    issues,
    candidate.evidenceIds,
    "/evidenceIds",
    "ExecutionEvent.evidenceIds",
  );

  return result(issues);
}

export function validateEvidenceRecord(candidate: unknown): ConformanceResult {
  const issues: ConformanceIssue[] = [];
  if (!validatePlainObjectField(issues, candidate, "/", "EvidenceRecord")) {
    return result(issues);
  }

  validateStringField(issues, candidate.evidenceId, "/evidenceId", "EvidenceRecord.evidenceId");
  validateStringField(issues, candidate.executionId, "/executionId", "EvidenceRecord.executionId");
  validateStringField(issues, candidate.kind, "/kind", "EvidenceRecord.kind");
  validateStringField(issues, candidate.recordedAt, "/recordedAt", "EvidenceRecord.recordedAt", {
    dateTime: true,
  });
  validateStringField(issues, candidate.summary, "/summary", "EvidenceRecord.summary", {
    required: false,
  });
  validateOptionalObjectField(issues, candidate.data, "/data", "EvidenceRecord.data");
  validateStringField(issues, candidate.sourceRef, "/sourceRef", "EvidenceRecord.sourceRef", {
    required: false,
  });

  return result(issues);
}

function appendNestedIssues(
  target: ConformanceIssue[],
  prefix: string,
  nested: ConformanceResult,
): void {
  for (const nestedIssue of nested.issues) {
    target.push({
      ...nestedIssue,
      path: `${prefix}${nestedIssue.path === "/" ? "" : nestedIssue.path}`,
    });
  }
}

function requiresEvidence(capability: CapabilityDescriptor, requests: ExecutionRequest[]): boolean {
  if (
    capability.completionMode === "readback_confirmed" ||
    capability.completionMode === "observed_effect"
  ) {
    return true;
  }

  return requests.some((request) => {
    const required = request.evidencePolicy?.required;
    return required === true;
  });
}

function collectSupportingEvidenceIds(
  event: ExecutionEvent,
  executionId: string,
  evidenceById: Map<string, EvidenceRecord>,
): string[] {
  if (event.type !== "evidence_recorded" || !Array.isArray(event.evidenceIds)) {
    return [];
  }

  return event.evidenceIds.filter((evidenceId) => {
    const evidence = evidenceById.get(evidenceId);
    return evidence !== undefined && evidence.executionId === executionId;
  });
}

export function validateExecutionTrace(candidate: unknown): ConformanceResult {
  const issues: ConformanceIssue[] = [];
  if (!validatePlainObjectField(issues, candidate, "/", "ExecutionTrace")) {
    return result(issues);
  }

  appendNestedIssues(issues, "/capability", validateCapabilityDescriptor(candidate.capability));

  if (!Array.isArray(candidate.requests) || candidate.requests.length === 0) {
    issues.push(
      issue("schema_validation_failed", "ExecutionTrace.requests must contain at least one request", "/requests"),
    );
  }

  if (!Array.isArray(candidate.events)) {
    issues.push(issue("schema_validation_failed", "ExecutionTrace.events must be an array", "/events"));
  }

  if (!Array.isArray(candidate.evidence)) {
    issues.push(
      issue("schema_validation_failed", "ExecutionTrace.evidence must be an array", "/evidence"),
    );
  }

  const requests = Array.isArray(candidate.requests) ? candidate.requests : [];
  const events = Array.isArray(candidate.events) ? candidate.events : [];
  const evidence = Array.isArray(candidate.evidence) ? candidate.evidence : [];

  requests.forEach((request, index) => {
    appendNestedIssues(issues, `/requests/${index}`, validateExecutionRequest(request));
  });
  events.forEach((event, index) => {
    appendNestedIssues(issues, `/events/${index}`, validateExecutionEvent(event));
  });
  evidence.forEach((record, index) => {
    appendNestedIssues(issues, `/evidence/${index}`, validateEvidenceRecord(record));
  });

  const typedCapability = isPlainObject(candidate.capability)
    ? (candidate.capability as unknown as CapabilityDescriptor)
    : undefined;
  const typedRequests = requests.filter(isPlainObject) as unknown as ExecutionRequest[];
  const typedEvents = events.filter(isPlainObject) as unknown as ExecutionEvent[];
  const typedEvidence = evidence.filter(isPlainObject) as unknown as EvidenceRecord[];

  const knownExecutionIds = new Set(
    typedRequests
      .map((request) => request.executionId)
      .filter((executionId): executionId is string => isNonEmptyString(executionId)),
  );
  const evidenceById = new Map<string, EvidenceRecord>();

  typedEvidence.forEach((record, index) => {
    if (!knownExecutionIds.has(record.executionId)) {
      issues.push(
        issue(
          "unknown_execution_id",
          `Evidence references unknown executionId ${record.executionId}`,
          `/evidence/${index}/executionId`,
        ),
      );
    }
    if (isNonEmptyString(record.evidenceId)) {
      evidenceById.set(record.evidenceId, record);
    }
  });

  const stateByExecutionId = new Map<
    string,
    {
      acknowledged: boolean;
      terminal?: ExecutionEventType;
      hasResolvableEvidence: boolean;
      hasEvidenceEvent: boolean;
    }
  >();

  const requestsByExecutionId = new Map<string, ExecutionRequest[]>();
  typedRequests.forEach((request) => {
    if (!isNonEmptyString(request.executionId)) return;
    const group = requestsByExecutionId.get(request.executionId) ?? [];
    group.push(request);
    requestsByExecutionId.set(request.executionId, group);
  });

  let previousTimestamp = Number.NEGATIVE_INFINITY;
  typedEvents.forEach((event, index) => {
    if (!knownExecutionIds.has(event.executionId)) {
      issues.push(
        issue(
          "unknown_execution_id",
          `Event references unknown executionId ${event.executionId}`,
          `/events/${index}/executionId`,
        ),
      );
      return;
    }

    const currentTimestamp = Date.parse(event.at);
    if (currentTimestamp < previousTimestamp) {
      issues.push(
        issue(
          "event_time_regressed",
          `Event time ${event.at} regressed relative to the previous event`,
          `/events/${index}/at`,
        ),
      );
    }
    previousTimestamp = Math.max(previousTimestamp, currentTimestamp);

    const hadPriorState = stateByExecutionId.has(event.executionId);

    const existingState = stateByExecutionId.get(event.executionId);

    if (event.type === "requested" && hadPriorState && existingState?.terminal === undefined) {
      issues.push(
        issue(
          "requested_not_first",
          "`requested` events must appear first for their execution when present",
          `/events/${index}/type`,
        ),
      );
    }

    const state = existingState ?? {
      acknowledged: false,
      hasResolvableEvidence: false,
      hasEvidenceEvent: false,
    };

    if (state.terminal !== undefined) {
      if (event.type === "evidence_recorded") {
        state.hasEvidenceEvent = true;
        const supportingEvidenceIds = collectSupportingEvidenceIds(event, event.executionId, evidenceById);
        if (
          !Array.isArray(event.evidenceIds) ||
          event.evidenceIds.length === 0 ||
          supportingEvidenceIds.length !== event.evidenceIds.length
        ) {
          issues.push(
            issue(
              "unresolved_evidence_reference",
              "Evidence references must resolve to records on the same execution",
              `/events/${index}/evidenceIds`,
            ),
          );
        }
        state.hasResolvableEvidence ||= supportingEvidenceIds.length > 0;
        stateByExecutionId.set(event.executionId, state);
        return;
      }

      if (event.type === state.terminal) {
        issues.push(
          issue(
            "terminal_event_repeated",
            `Execution ${event.executionId} repeated terminal event ${event.type}`,
            `/events/${index}/type`,
          ),
        );
      } else if (TERMINAL_EVENT_TYPES.has(event.type)) {
        issues.push(
          issue(
            "dual_terminal_events",
            `Execution ${event.executionId} emitted both ${state.terminal} and ${event.type}`,
            `/events/${index}/type`,
          ),
        );
      } else {
        issues.push(
          issue(
            "invalid_post_terminal_transition",
            `Execution ${event.executionId} emitted ${event.type} after terminal ${state.terminal}`,
            `/events/${index}/type`,
          ),
        );
      }
      stateByExecutionId.set(event.executionId, state);
      return;
    }

    switch (event.type) {
      case "acknowledged":
        state.acknowledged = true;
        break;
      case "completed": {
        if (!state.acknowledged) {
          issues.push(
            issue(
              "completed_without_acknowledged",
              `Execution ${event.executionId} completed without a prior acknowledged event`,
              `/events/${index}/type`,
            ),
          );
        }

        const groupedRequests = requestsByExecutionId.get(event.executionId) ?? [];
        if (
          typedCapability !== undefined &&
          requiresEvidence(typedCapability, groupedRequests) &&
          !state.hasResolvableEvidence &&
          !state.hasEvidenceEvent
        ) {
          issues.push(
            issue(
              "evidence_required_for_completion",
              `Execution ${event.executionId} completed without supporting evidence`,
              `/events/${index}/type`,
            ),
          );
        }

        state.terminal = "completed";
        break;
      }
      case "failed":
        state.terminal = "failed";
        break;
      case "evidence_recorded": {
        state.hasEvidenceEvent = true;
        const supportingEvidenceIds = collectSupportingEvidenceIds(event, event.executionId, evidenceById);
        if (
          !Array.isArray(event.evidenceIds) ||
          event.evidenceIds.length === 0 ||
          supportingEvidenceIds.length !== event.evidenceIds.length
        ) {
          issues.push(
            issue(
              "unresolved_evidence_reference",
              "Evidence references must resolve to records on the same execution",
              `/events/${index}/evidenceIds`,
            ),
          );
        }
        state.hasResolvableEvidence ||= supportingEvidenceIds.length > 0;
        break;
      }
      case "requested":
      default:
        break;
    }

    stateByExecutionId.set(event.executionId, state);
  });

  const requestsByIdempotencyKey = new Map<string, ExecutionRequest[]>();
  typedRequests.forEach((request) => {
    if (!isNonEmptyString(request.idempotencyKey)) return;
    const group = requestsByIdempotencyKey.get(request.idempotencyKey) ?? [];
    group.push(request);
    requestsByIdempotencyKey.set(request.idempotencyKey, group);
  });

  for (const [idempotencyKey, group] of requestsByIdempotencyKey) {
    if (group.length < 2) continue;

    const executionIds = [...new Set(group.map((request) => request.executionId))];
    const capabilityIds = [...new Set(group.map((request) => request.capabilityId))];
    const canonicalInput = stableStringify(group[0]?.input);
    const hasInputMismatch = group.some(
      (request) =>
        stableStringify(request.input) !== canonicalInput ||
        request.capabilityId !== group[0]?.capabilityId,
    );

    const terminalExecutions = new Set(
      typedEvents
        .filter(
          (event) =>
            TERMINAL_EVENT_TYPES.has(event.type) &&
            executionIds.includes(event.executionId),
        )
        .map((event) => event.executionId),
    );

    if (terminalExecutions.size > 1) {
      issues.push(
        issue(
          "idempotency_multiple_terminals",
          `Idempotency group ${idempotencyKey} produced terminal outcomes for multiple executions`,
          `/requests`,
        ),
      );
      continue;
    }

    if (executionIds.length > 1) {
      issues.push(
        issue(
          "idempotency_execution_mismatch",
          `Idempotency group ${idempotencyKey} reused multiple executionIds`,
          `/requests`,
        ),
      );
    }

    if (capabilityIds.length > 1 || hasInputMismatch) {
      issues.push(
        issue(
          "idempotency_input_mismatch",
          `Idempotency group ${idempotencyKey} changed capability or input across retries`,
          `/requests`,
        ),
      );
    }
  }

  return result(issues);
}

export function assertExecutionTrace(candidate: unknown): ExecutionTrace {
  const validation = validateExecutionTrace(candidate);
  if (!validation.ok) {
    throw new ConformanceError(validation.issues);
  }

  return candidate as ExecutionTrace;
}
