# `@eeap/sdk-ts`

TypeScript reference validator for EEAP core objects and the v1 conformance profile.

This package is currently a **validator SDK**, not a transport/client SDK. Use it when you want to:

- validate raw EEAP objects
- validate a full `ExecutionTrace`
- fail fast in tests or CI when a trace violates EEAP semantics

## Build

From the repo root:

```bash
npm run build --workspace @eeap/sdk-ts
```

## Quick Start

Real example: validate a warehouse door unlock trace that only completes after controller readback confirms the door is unlocked.

```ts
import {
  assertExecutionTrace,
  validateExecutionTrace,
  formatConformanceIssues,
  type ExecutionTrace,
} from "@eeap/sdk-ts";

const trace: ExecutionTrace = {
  capability: {
    id: "warehouse.door.unlock",
    title: "Unlock Warehouse Door",
    description: "Unlock a named warehouse door via access control system",
    inputSchema: {
      type: "object",
      properties: {
        siteId: { type: "string" },
        doorId: { type: "string" },
      },
      required: ["siteId", "doorId"],
    },
    evidenceModes: ["readback"],
    completionMode: "readback_confirmed",
    idempotent: true,
  },
  requests: [
    {
      executionId: "exec-readback",
      capabilityId: "warehouse.door.unlock",
      input: {
        siteId: "ams-1",
        doorId: "door-8",
      },
      idempotencyKey: "idem-readback",
      requestedAt: "2026-04-23T20:12:00Z",
      evidencePolicy: {
        required: true,
      },
    },
  ],
  events: [
    {
      eventId: "evt-requested",
      executionId: "exec-readback",
      type: "requested",
      at: "2026-04-23T20:12:00Z",
    },
    {
      eventId: "evt-ack",
      executionId: "exec-readback",
      type: "acknowledged",
      at: "2026-04-23T20:12:02Z",
    },
    {
      eventId: "evt-evidence",
      executionId: "exec-readback",
      type: "evidence_recorded",
      at: "2026-04-23T20:12:04Z",
      evidenceIds: ["ev-readback"],
    },
    {
      eventId: "evt-completed",
      executionId: "exec-readback",
      type: "completed",
      at: "2026-04-23T20:12:05Z",
    },
  ],
  evidence: [
    {
      evidenceId: "ev-readback",
      executionId: "exec-readback",
      kind: "readback",
      recordedAt: "2026-04-23T20:12:03Z",
      summary: "Controller state matched expected unlocked state",
      data: {
        lockState: "unlocked",
      },
    },
  ],
};

const result = validateExecutionTrace(trace);

if (!result.ok) {
  console.error(formatConformanceIssues(result.issues));
}

assertExecutionTrace(trace);
```

This example passes because `readback_confirmed` requires evidence before `completed`, and the trace includes both `evidence_recorded` and a matching `EvidenceRecord`.

## Adapter Walkthrough

If you are writing an adapter, the common task is to start with a runtime request and finish with vendor evidence.

This repo now includes a runnable webhook example in `sdk/ts/examples/assemble-trace-from-webhook.mjs`.

The flow is:

1. create an `ExecutionTrace` from the runtime request
2. append `acknowledged` when the controller accepts the command
3. translate the vendor webhook into an `EvidenceRecord`
4. append `evidence_recorded`
5. append `completed` only after the readback evidence exists

Core translation step:

```ts
function applyControllerWebhook(trace, webhook) {
  const executionId = trace.requests[0].executionId;
  const evidenceId = `ev-${webhook.controllerEventId}`;

  trace.evidence.push({
    evidenceId,
    executionId,
    kind: "readback",
    recordedAt: webhook.observedAt,
    summary: `Controller ${webhook.controllerId} reported ${webhook.lockState}`,
    data: {
      lockState: webhook.lockState,
      controllerId: webhook.controllerId,
      controllerEventId: webhook.controllerEventId,
    },
    sourceRef: `vendor://controllers/${webhook.controllerId}/events/${webhook.controllerEventId}`,
  });

  trace.events.push({
    eventId: `evt-evidence-${webhook.controllerEventId}`,
    executionId,
    type: "evidence_recorded",
    at: webhook.receivedAt,
    evidenceIds: [evidenceId],
  });

  trace.events.push({
    eventId: `evt-completed-${webhook.controllerEventId}`,
    executionId,
    type: "completed",
    at: webhook.completedAt,
  });
}
```

## Public API

- `validateCapabilityDescriptor(candidate)`
- `validateExecutionRequest(candidate)`
- `validateExecutionEvent(candidate)`
- `validateEvidenceRecord(candidate)`
- `validateExecutionTrace(candidate)`
- `assertExecutionTrace(candidate)`
- `formatConformanceIssues(issues)`
- `ConformanceError`

## Validation Style

- `validate*` functions return `{ ok, issues }`
- `assertExecutionTrace` returns the original trace when valid
- `assertExecutionTrace` throws `ConformanceError` when invalid
- `formatConformanceIssues` turns issue arrays into readable multiline output

## Runnable Example

After building the package:

```bash
node sdk/ts/examples/validate-trace.mjs
node sdk/ts/examples/assemble-trace-from-webhook.mjs
```

The runnable script validates:

- one valid `warehouse.door.unlock` trace
- one broken variant with the evidence removed, so you can see the real failure output
- one adapter-oriented example that assembles a valid trace from a simulated controller webhook
