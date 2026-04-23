import {
  assertExecutionTrace,
  formatConformanceIssues,
  validateExecutionTrace,
} from "../dist/index.js";

const capability = {
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
  evidenceModes: ["readback", "webhook"],
  completionMode: "readback_confirmed",
  idempotent: true,
};

function createTraceFromRuntimeRequest({ executionId, siteId, doorId, requestedAt }) {
  return {
    capability,
    requests: [
      {
        executionId,
        capabilityId: capability.id,
        input: {
          siteId,
          doorId,
        },
        idempotencyKey: `idem-${executionId}`,
        requestedAt,
        evidencePolicy: {
          required: true,
        },
      },
    ],
    events: [
      {
        eventId: `evt-requested-${executionId}`,
        executionId,
        type: "requested",
        at: requestedAt,
        summary: `Runtime requested unlock for ${siteId}/${doorId}`,
      },
    ],
    evidence: [],
  };
}

function recordAdmission(trace, { at, controllerRequestId }) {
  const { executionId } = trace.requests[0];

  trace.events.push({
    eventId: `evt-ack-${executionId}`,
    executionId,
    type: "acknowledged",
    at,
    summary: "Controller accepted the unlock command",
    metadata: {
      controllerRequestId,
    },
  });

  return trace;
}

function applyControllerWebhook(trace, webhook) {
  const { executionId } = trace.requests[0];
  const evidenceId = `ev-${webhook.controllerEventId}`;

  trace.evidence.push({
    evidenceId,
    executionId,
    kind: "readback",
    recordedAt: webhook.observedAt,
    summary: `Controller ${webhook.controllerId} reported ${webhook.lockState}`,
    data: {
      siteId: webhook.siteId,
      doorId: webhook.doorId,
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
    summary: "Adapter translated controller webhook into EEAP evidence",
    evidenceIds: [evidenceId],
  });

  trace.events.push({
    eventId: `evt-completed-${webhook.controllerEventId}`,
    executionId,
    type: "completed",
    at: webhook.completedAt,
    summary: "Door unlock completed after readback confirmed unlocked state",
  });

  return trace;
}

const trace = createTraceFromRuntimeRequest({
  executionId: "exec-webhook-demo",
  siteId: "ams-1",
  doorId: "door-8",
  requestedAt: "2026-04-23T20:12:00Z",
});

recordAdmission(trace, {
  at: "2026-04-23T20:12:02Z",
  controllerRequestId: "ctrl-req-441",
});

applyControllerWebhook(trace, {
  controllerEventId: "ctrl-evt-9912",
  controllerId: "ctrl-a7",
  siteId: "ams-1",
  doorId: "door-8",
  lockState: "unlocked",
  observedAt: "2026-04-23T20:12:03Z",
  receivedAt: "2026-04-23T20:12:04Z",
  completedAt: "2026-04-23T20:12:05Z",
});

const result = validateExecutionTrace(trace);

console.log(`Webhook-assembled trace: ${result.ok}`);

if (!result.ok) {
  console.log(formatConformanceIssues(result.issues));
} else {
  assertExecutionTrace(trace);
  console.log("Adapter webhook assembly passed conformance.");
}

console.log("\nFinal trace:");
console.log(JSON.stringify(trace, null, 2));
