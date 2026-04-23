# EEAP Core v0

## Purpose

EEAP defines a thin canonical contract between an agent runtime and an external execution implementation. It does not attempt to replace vendor APIs, device protocols, or workflow engines. Instead, it standardizes how runtimes describe executable capabilities, request execution, observe lifecycle transitions, and record evidence.

## Canonical Objects

### CapabilityDescriptor

`CapabilityDescriptor` describes an executable capability exposed to a runtime.

Required fields:

- `id`: stable capability identifier
- `title`: short human-readable name
- `description`: concise behavioral description
- `inputSchema`: JSON Schema describing the accepted request payload

Optional fields:

- `outputSchema`: JSON Schema for a synchronous result summary
- `evidenceModes`: list of evidence forms the capability may emit
- `completionMode`: semantic completion rule, such as `accepted_only`, `readback_confirmed`, or `observed_effect`
- `idempotent`: whether repeated requests with the same intent are expected to converge safely

### ExecutionRequest

`ExecutionRequest` creates a new external execution attempt.

Required fields:

- `executionId`: caller-assigned or runtime-assigned unique identifier
- `capabilityId`: the target capability
- `input`: payload validated against `inputSchema`
- `idempotencyKey`: stable key for retry-safe submission
- `requestedAt`: request timestamp

Optional fields:

- `contextRef`: runtime-local reference, such as a workstream or conversation identifier
- `deadlineAt`: execution deadline
- `requestedBy`: logical actor or runtime identifier
- `evidencePolicy`: requirement hints for expected evidence behavior

### ExecutionEvent

`ExecutionEvent` represents one immutable lifecycle fact emitted by an execution implementation.

Required fields:

- `eventId`: unique event identifier
- `executionId`: owning execution
- `type`: lifecycle event type
- `at`: event timestamp

Optional fields:

- `summary`: short explanatory text
- `metadata`: implementation-specific structured details
- `evidenceIds`: references to `EvidenceRecord` objects

### EvidenceRecord

`EvidenceRecord` is a first-class fact supporting claims about external execution state.

Required fields:

- `evidenceId`: unique evidence identifier
- `executionId`: owning execution
- `kind`: evidence type, such as `readback`, `webhook`, `snapshot`, `log`, or `receipt`
- `recordedAt`: evidence timestamp

Optional fields:

- `summary`: short explanation of what was observed
- `data`: structured evidence payload
- `sourceRef`: implementation-specific source reference

## Non-Goals

EEAP core does not define:

- connector discovery
- authentication or OAuth exchange
- HTTP endpoints or callback envelopes
- queue protocols or webhook delivery semantics
- thick object models for devices, locations, actors, or assets

## Design Constraints

- The core must remain transport-agnostic.
- The core must remain vendor-agnostic.
- The core must prioritize durable execution facts over invocation convenience.
- The core must support both synchronous and asynchronous execution paths.
