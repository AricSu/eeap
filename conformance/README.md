# EEAP Conformance

This directory holds the v1 reference materials used to prove EEAP core semantics independent of transport, auth, or vendor-specific adapters.

## V1 Scope

The v1 conformance profile tightens the base spec into executable validation rules. It covers:

- schema compliance for all core objects
- lifecycle transition validation
- evidence linkage and completion requirements
- idempotency behavior for retry-safe execution groups

It does not yet cover:

- transport profiles
- auth profiles
- webhook envelope formats
- vendor or vertical-specific adapter behavior

## Artifact Layout

- `fixtures/valid/`: golden traces that must validate cleanly
- `fixtures/invalid/`: golden traces that must fail with stable issue codes
- `sdk/ts/src/validation.ts`: TypeScript reference validator used by repo tests

## V1 Trace Rules

The v1 validator enforces these semantic tightenings:

- every trace contains at least one `ExecutionRequest`
- `requested` is optional, but when present it is the first event for that execution
- `completed` requires an earlier `acknowledged`
- `failed` may occur without `acknowledged`
- `completed` and `failed` are terminal and mutually exclusive
- after a terminal event, only `evidence_recorded` may be appended
- event array order is authoritative and event timestamps must be non-decreasing
- `readback_confirmed` and `observed_effect` require supporting evidence before `completed`
- `evidence_recorded` must resolve to `EvidenceRecord` entries on the same execution

Idempotency groups are also tightened:

- one `idempotencyKey` must converge on one `executionId`
- retries must not change `capabilityId` or `input`
- one idempotency group must not emit terminal outcomes for multiple executions

## Stable Issue Codes

The first validator release emits stable issue codes so external implementations can assert behavior without parsing free-form strings. The initial set includes:

- `unknown_execution_id`
- `requested_not_first`
- `completed_without_acknowledged`
- `dual_terminal_events`
- `terminal_event_repeated`
- `invalid_post_terminal_transition`
- `evidence_required_for_completion`
- `unresolved_evidence_reference`
- `event_time_regressed`
- `idempotency_execution_mismatch`
- `idempotency_input_mismatch`
- `idempotency_multiple_terminals`
