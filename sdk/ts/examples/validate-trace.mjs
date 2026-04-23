import {
  assertExecutionTrace,
  formatConformanceIssues,
  validateExecutionTrace,
} from "../dist/index.js";

const validTrace = {
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

const brokenTrace = {
  ...validTrace,
  events: validTrace.events.filter((event) => event.type !== "evidence_recorded"),
  evidence: [],
};

const validResult = validateExecutionTrace(validTrace);
console.log(`Valid warehouse trace: ${validResult.ok}`);
assertExecutionTrace(validTrace);
console.log("assertExecutionTrace passed for the valid trace.\n");

const brokenResult = validateExecutionTrace(brokenTrace);
console.log(`Broken warehouse trace: ${brokenResult.ok}`);
if (!brokenResult.ok) {
  console.log(formatConformanceIssues(brokenResult.issues));
}
